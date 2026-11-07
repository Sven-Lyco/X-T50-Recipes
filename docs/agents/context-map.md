# Context map

One row per bounded context. Keep it in sync with the folders under `contexts/`.

| Bounded context | Type | Purpose | Key actors | Folder |
|---|---|---|---|---|

Type is one of `core` (competitive advantage, build it carefully), `supporting` (needed, but not a differentiator) or `generic` (solved problem, prefer an existing solution).

## Relationships

| Upstream | Downstream | Relationship | Integration |
|---|---|---|---|

Relationship examples: customer-supplier, conformist, anti-corruption layer, open host service, published language, shared kernel, partnership.
Integration names what the two contexts share: implementation details, business logic, a domain model, or only a contract. Prefer a contract.
