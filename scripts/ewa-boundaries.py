#!/usr/bin/env python3
"""Checks the code against the project's architecture model (installed by /ewa:quality-gates).

The model lives in two Markdown files:
  docs/agents/context-map.md    bounded contexts with a "Code" column (paths of each
                                context's code, as globs in backticks; `api:` before a
                                glob marks the context's public part) and the
                                "Relationships" table: a downstream context may use its
                                upstream context; shared kernel and partnership allow
                                both directions
  docs/agents/architecture.md   optional rings from the inside out ("Level", "Ring",
                                "Code", "Contexts"): code may use its own ring and rings
                                with a lower level; rings on the same level must not use
                                each other

Rules checked for every dependency between two files of the repository:
  context   a context uses another context without a relationship that allows it
  api       a context uses the internals of a context that declares an API
  ring      code uses a ring further out
  sibling   code uses another ring on the same level

Dependencies come from imports (Python, JavaScript/TypeScript with relative paths,
Java, Kotlin, Swift modules) and, for Swift, from type names declared in other files,
because Swift files of one module do not import each other. Not seen: reflection,
dependency injection by name, path aliases.

Known violations can be accepted in docs/agents/architecture-baseline.txt; only new
ones fail. Usage (from anywhere; paths are relative to the project root):
  ewa-boundaries.py check [root] [--json]   exit 1 on violations not in the baseline
  ewa-boundaries.py baseline [root]         write all current violations to the baseline
  ewa-boundaries.py coupling [root] --since YYYY-MM-DD
                                            share of commits that changed more than one context
Standard library only, Python 3.8+.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

AGENTS_DIR = "docs/agents"
BASELINE = "architecture-baseline.txt"
BOTH_WAYS = ("shared kernel", "partnership")
SOURCE_EXT = {".py", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".java", ".kt", ".kts", ".swift"}
JS_EXT = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")


# ---- model ----

def glob_regex(pattern):
    """`**` matches across folders, `*` within one name, `?` one character."""
    out, i = "", 0
    p = pattern.strip().strip("/")
    while i < len(p):
        if p.startswith("**/", i):
            out += "(?:.*/)?"
            i += 3
        elif p.startswith("**", i):
            out += ".*"
            i += 2
        elif p[i] == "*":
            out += "[^/]*"
            i += 1
        elif p[i] == "?":
            out += "[^/]"
            i += 1
        else:
            out += re.escape(p[i])
            i += 1
    return re.compile("^" + out + "(?:/.*)?$")


def specificity(pattern):
    return len(re.split(r"[*?]", pattern, maxsplit=1)[0])


def tables(text):
    """Markdown tables as lists of dicts, keyed by lower-case header."""
    result, lines = [], text.splitlines()
    i = 0
    while i < len(lines):
        if lines[i].lstrip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]):
            head = [c.strip().lower() for c in lines[i].strip().strip("|").split("|")]
            rows, j = [], i + 2
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                cells = [c.strip() for c in lines[j].strip().strip("|").split("|")]
                rows.append(dict(zip(head, cells + [""] * (len(head) - len(cells)))))
                j += 1
            result.append((head, rows))
            i = j
        else:
            i += 1
    return result


def names(cell):
    """Context names in a cell: comma separated, text in parentheses ignored."""
    cell = re.sub(r"\([^)]*\)", "", cell)
    return [n.strip().lower() for n in cell.split(",") if n.strip()]


def code_patterns(cell):
    code, api = [], []
    for m in re.finditer(r"(api:\s*)?`([^`]+)`", cell):
        (api if m.group(1) else code).append(m.group(2).strip())
    return code + api, api


def load_model(root, agents_dir=AGENTS_DIR):
    model = {"contexts": {}, "allowed": set(), "rings": []}
    cmap = Path(root) / agents_dir / "context-map.md"
    if cmap.is_file():
        for head, rows in tables(cmap.read_text(encoding="utf-8")):
            if "bounded context" in head and "code" in head:
                for r in rows:
                    name = r["bounded context"].strip().lower()
                    code, api = code_patterns(r.get("code", ""))
                    if name and code:
                        model["contexts"][name] = {"code": code, "api": api}
            elif "upstream" in head and "downstream" in head:
                for r in rows:
                    both = any(k in r.get("relationship", "").lower() for k in BOTH_WAYS)
                    for up in names(r["upstream"]):
                        for down in names(r["downstream"]):
                            model["allowed"].add((down, up))
                            if both:
                                model["allowed"].add((up, down))
    arch = Path(root) / agents_dir / "architecture.md"
    if arch.is_file():
        for head, rows in tables(arch.read_text(encoding="utf-8")):
            if "ring" in head and "code" in head and "level" in head:
                for r in rows:
                    code, _ = code_patterns(r.get("code", ""))
                    try:
                        level = int(r["level"])
                    except ValueError:
                        continue
                    ctx = r.get("contexts", "").strip().lower()
                    contexts = None if ctx in ("", "all", "-") else set(names(ctx))
                    if code:
                        model["rings"].append({"name": r["ring"].strip(), "level": level, "code": code,
                                               "contexts": contexts})
    return model


def configured(model):
    return bool(model["contexts"] or model["rings"])


def best(path, candidates):
    """The candidate whose pattern matches path most specifically, or None."""
    found, score = None, -1
    for item, patterns in candidates:
        for p in patterns:
            if glob_regex(p).match(path) and specificity(p) > score:
                found, score = item, specificity(p)
    return found


def context_of(path, model):
    return best(path, [(n, c["code"]) for n, c in model["contexts"].items()])


def in_api(path, ctx, model):
    api = model["contexts"][ctx]["api"]
    return any(glob_regex(p).match(path) for p in api)


def ring_of(path, ctx, model):
    rings = [r for r in model["rings"] if r["contexts"] is None or (ctx and ctx in r["contexts"])]
    return best(path, [(r["name"], r["code"]) for r in rings]), {r["name"]: r["level"] for r in rings}


# ---- dependencies ----

def files(root):
    try:
        out = subprocess.run(["git", "-C", str(root), "ls-files", "--cached", "--others", "--exclude-standard"],
                             stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, universal_newlines=True, timeout=60)
        listed = out.stdout.splitlines() if out.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        listed = None
    if listed is None:
        listed = []
        for d, dirs, fs in os.walk(str(root)):
            dirs[:] = [x for x in dirs if not x.startswith(".") and x not in ("node_modules", "build", "dist")]
            listed += [os.path.relpath(os.path.join(d, f), str(root)).replace(os.sep, "/") for f in fs]
    return sorted(f for f in listed if Path(f).suffix in SOURCE_EXT and (Path(root) / f).is_file())


def strip_comments(text, ext):
    if ext == ".py":
        return re.sub(r"#.*", "", text)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"//[^\n]*", "", text)


class Index:
    def __init__(self, paths):
        self.paths = set(paths)
        self.by_suffix = {}
        for p in paths:
            parts = Path(p).with_suffix("").parts
            for i in range(len(parts)):
                self.by_suffix.setdefault("/".join(parts[i:]), []).append(p)
            if Path(p).name == "__init__.py":
                pkg = Path(p).parent.parts
                for i in range(len(pkg)):
                    self.by_suffix.setdefault("/".join(pkg[i:]), []).append(p)

    def suffix(self, rel, exts=None):
        hits = self.by_suffix.get(rel, [])
        return [h for h in hits if exts is None or Path(h).suffix in exts]


def deps_python(path, text, index):
    out = set()
    pkg = Path(path).parent
    for m in re.finditer(r"^[ \t]*(?:from[ \t]+(\.*)([\w.]*)[ \t]+import[ \t]+(\([^)]*\)|[\w*, \t]+)|import[ \t]+([\w., \t]+))",
                         text, re.M):
        dots, mod, items, plain = m.groups()
        if plain:
            for name in plain.split(","):
                name = name.strip().split(" as ")[0].strip()
                out.update(index.suffix(name.replace(".", "/"), {".py"}))
            continue
        base = mod.replace(".", "/")
        if dots:
            up = pkg
            for _ in range(len(dots) - 1):
                up = up.parent
            base = "/".join(x for x in (up.as_posix().strip("."), base) if x and x != ".")
            exact = [p for p in index.paths if Path(p).with_suffix("").as_posix() == base or p == base + "/__init__.py"]
            out.update(exact)
            for item in re.split(r"[,\s()]+", items):
                if item and item != "*":
                    sub = base + "/" + item if base else item
                    out.update(p for p in index.paths if Path(p).with_suffix("").as_posix() == sub)
            continue
        found = []
        for item in re.split(r"[,\s()]+", items):
            if item and item != "*":
                found += index.suffix(base + "/" + item, {".py"})
        out.update(found or index.suffix(base, {".py"}))
    return out


def deps_js(path, text, index):
    out = set()
    folder = Path(path).parent
    for m in re.finditer(r"""(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)['"](\.{1,2}/[^'"]+)['"]""", text):
        target = os.path.normpath((folder / m.group(1)).as_posix()).replace(os.sep, "/")
        stem = re.sub(r"\.(?:js|jsx|mjs|cjs|ts|tsx)$", "", target)
        for cand in [target] + [stem + e for e in JS_EXT] + [target + "/index" + e for e in JS_EXT]:
            if cand in index.paths:
                out.add(cand)
                break
    return out


def deps_jvm(path, text, index):
    out = set()
    for m in re.finditer(r"^\s*import\s+(?:static\s+)?([\w.]+)(\.\*)?\s*(?:as\s+\w+)?;?\s*$", text, re.M):
        name, star = m.group(1), m.group(2)
        exts = {".java", ".kt", ".kts"}
        if star:  # only the classes of that package that the file really names
            prefix = name.replace(".", "/") + "/"
            used = set(re.findall(r"\b[A-Z]\w*\b", text))
            out.update(p for p in index.paths if Path(p).suffix in exts and Path(p).stem in used and
                       ("/" + p).find("/" + prefix) >= 0 and "/" not in p.split(prefix, 1)[-1])
        else:
            parts = name.split(".")
            for k in range(len(parts), 1, -1):  # static imports name a member after the class
                hits = index.suffix("/".join(parts[:k]), exts)
                if hits:
                    out.update(hits)
                    break
    return out


SWIFT_DECL = re.compile(r"^\s*(?:@\w+\s+)*(?:(?:public|internal|private|fileprivate|open|final|indirect)\s+)*"
                        r"(?:class|struct|enum|protocol|actor|typealias)\s+([A-Z]\w*)", re.M)


def swift_types(texts):
    owners = {}
    for p, t in texts.items():
        if p.endswith(".swift"):
            for name in SWIFT_DECL.findall(t):
                owners.setdefault(name, set()).add(p)
    return {n: next(iter(ps)) for n, ps in owners.items() if len(ps) == 1}


def deps_swift(path, text, index, types):
    out = set()
    for m in re.finditer(r"^\s*(?:@\w+\s+)?import\s+(?:\w+\s+)?(\w+)", text, re.M):
        mod = m.group(1)
        out.update(p for p in index.paths if p.endswith(".swift") and ("/Sources/%s/" % mod in "/" + p))
    stripped = re.sub(r'"(?:\\.|[^"\\])*"', '""', text)
    for word in set(re.findall(r"\b[A-Z]\w*\b", stripped)):
        owner = types.get(word)
        if owner and owner != path:
            out.add(owner)
    return out


def dependencies(root):
    root = Path(root)
    paths = files(root)
    index = Index(paths)
    texts = {}
    for p in paths:
        try:
            texts[p] = strip_comments((root / p).read_text(encoding="utf-8", errors="replace"), Path(p).suffix)
        except OSError:
            continue
    types = swift_types(texts)
    edges = set()
    for p, t in texts.items():
        ext = Path(p).suffix
        if ext == ".py":
            found = deps_python(p, t, index)
        elif ext in JS_EXT:
            found = deps_js(p, t, index)
        elif ext in (".java", ".kt", ".kts"):
            found = deps_jvm(p, t, index)
        elif ext == ".swift":
            found = deps_swift(p, t, index, types)
        else:
            found = set()
        edges.update((p, q) for q in found if q != p)
    return paths, edges


# ---- rules ----

def violations(root, model):
    paths, edges = dependencies(root)
    found = []
    for src, dst in sorted(edges):
        cs, cd = context_of(src, model), context_of(dst, model)
        if cs and cd and cs != cd:
            if (cs, cd) not in model["allowed"]:
                found.append(("context", src, dst, "%s uses %s, but the context map has no relationship that allows it"
                              % (cs, cd)))
            elif model["contexts"][cd]["api"] and not in_api(dst, cd, model):
                found.append(("api", src, dst, "%s uses internals of %s; use its API" % (cs, cd)))
        if model["rings"]:
            rs, levels_s = ring_of(src, cs, model)
            rd, levels_d = ring_of(dst, cd, model)
            if rs and rd and rs != rd:
                ls, ld = levels_s[rs], levels_d[rd]
                if ld > ls:
                    found.append(("ring", src, dst, "ring %s (level %d) uses ring %s further out (level %d)" % (rs, ls, rd, ld)))
                elif ld == ls:
                    found.append(("sibling", src, dst, "ring %s uses ring %s on the same level" % (rs, rd)))
    unmapped = [p for p in paths if model["contexts"] and not context_of(p, model)]
    return found, paths, unmapped, edges


def key(v):
    return "%s %s -> %s" % (v[0], v[1], v[2])


def baseline_path(root, agents_dir=AGENTS_DIR):
    return Path(root) / agents_dir / BASELINE


def read_baseline(root):
    path = baseline_path(root)
    if not path.is_file():
        return set()
    return {l.strip() for l in path.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")}


def context_edges(edges, model):
    counts = {}
    for src, dst in edges:
        cs, cd = context_of(src, model), context_of(dst, model)
        if cs and cd and cs != cd:
            counts["%s -> %s" % (cs, cd)] = counts.get("%s -> %s" % (cs, cd), 0) + 1
    return dict(sorted(counts.items()))


def check(root, as_json=False):
    model = load_model(root)
    if not configured(model):
        msg = {"status": "not configured", "hint": "add a Code column to docs/agents/context-map.md "
                                                   "or rings to docs/agents/architecture.md"}
        print(json.dumps(msg) if as_json else "boundaries: not configured (%s)" % msg["hint"])
        return 0
    found, paths, unmapped, edges = violations(root, model)
    accepted = read_baseline(root)
    new = [v for v in found if key(v) not in accepted]
    fixed = sorted(accepted - {key(v) for v in found})
    if as_json:
        print(json.dumps({"status": "ok" if not new else "violations", "files": len(paths),
                          "unmapped_files": len(unmapped), "context_dependencies": context_edges(edges, model),
                          "new": [{"rule": v[0], "from": v[1], "to": v[2], "why": v[3]} for v in new],
                          "accepted": len(found) - len(new), "fixed_in_baseline": fixed}, indent=2))
        return 1 if new else 0
    for v in new:
        print("boundaries: %s: %s -> %s\n    %s" % (v[0], v[1], v[2], v[3]))
    if fixed:
        print("boundaries: %d accepted violation(s) are gone; refresh the baseline "
              "(ewa-boundaries.py baseline)" % len(fixed))
    summary = "boundaries: %d file(s), %d new violation(s), %d accepted" % (len(paths), len(new), len(found) - len(new))
    if unmapped:
        summary += ", %d file(s) in no context" % len(unmapped)
    print(summary)
    return 1 if new else 0


def write_baseline(root):
    model = load_model(root)
    found = violations(root, model)[0] if configured(model) else []
    path = baseline_path(root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("# Accepted architecture violations (ewa-boundaries.py). Only new ones fail the check.\n"
                    "# Remove a line when the violation is fixed.\n" + "".join(key(v) + "\n" for v in sorted(found)),
                    encoding="utf-8")
    print("boundaries: %d violation(s) written to %s" % (len(found), path))
    return 0


def coupling_data(root, since):
    """Commits since a date that changed code of one or more contexts, or None without code paths."""
    model = load_model(root)
    if not model["contexts"]:
        return None
    log = subprocess.run(["git", "-C", str(root), "log", "--no-merges", "--since=%s 00:00" % since,
                          "--name-only", "--format=@@%h"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                         universal_newlines=True).stdout
    touched, crossing, examples = 0, 0, []
    for block in log.split("@@")[1:]:
        lines = [l for l in block.splitlines() if l.strip()]
        contexts = {c for c in (context_of(f, model) for f in lines[1:]) if c}
        if contexts:
            touched += 1
            if len(contexts) > 1:
                crossing += 1
                examples.append({"commit": lines[0], "contexts": sorted(contexts)})
    return {"since": since, "commits_in_contexts": touched, "commits_across_contexts": crossing,
            "share": round(crossing / touched, 2) if touched else None, "examples": examples[:10]}


def coupling(root, since):
    data = coupling_data(root, since)
    print(json.dumps(data if data is not None else {"status": "not configured"}, indent=2))
    return 0


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    flags = [a for a in argv if a.startswith("--")]
    if not args or args[0] not in ("check", "baseline", "coupling"):
        sys.stderr.write(__doc__)
        return 2
    root = Path(args[1]) if len(args) > 1 else Path(__file__).resolve().parents[1]
    if args[0] == "check":
        return check(root, "--json" in flags)
    if args[0] == "baseline":
        return write_baseline(root)
    since = next((argv[i + 1] for i, a in enumerate(argv) if a == "--since" and i + 1 < len(argv)), None)
    if not since:
        sys.stderr.write("coupling needs --since YYYY-MM-DD\n")
        return 2
    args = [a for a in args if a != since]
    root = Path(args[1]) if len(args) > 1 else Path(__file__).resolve().parents[1]
    return coupling(root, since)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
