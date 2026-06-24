# 06 — Laufzeitsicht

## Szenario 1: Login

```
Browser / PWA       Spring Boot API
      │
      │── POST /api/auth/login ─────────────────────────►│
      │   {username, password}                            │
      │                                     LoginRateLimiter.isBlocked(ip)?
      │                                     BCrypt.matches(password, hash)
      │                                     JwtUtil.generateToken()
      │◄── 200 {token: "eyJ..."} ────────────────────────│
      │
      │  localStorage.setItem("jwt", token)
      │
      │── GET /api/recipes ───────────────────────────────►│
      │   Authorization: Bearer eyJ...                     │
      │                                     JwtAuthFilter.doFilter()
      │                                       → JWT validieren
      │                                       → SecurityContext setzen
      │◄── 200 [RecipeListItem[]] ────────────────────────│
```

## Szenario 2: KI-Generierung (POST /api/suggest)

```
Browser             Spring Boot API          Anthropic API
      │
      │── POST /api/suggest (multipart) ───────────────►│
      │   images[]: bis zu 5 Dateien                    │
      │   description?: string                          │
      │   model?: string                                │
      │                              ImageUtils.detectMimeType() per Magic Bytes
      │                              ImageUtils.extractExifContext() → EXIF-String
      │                              buildPrompt(description, imageCount, exif)
      │                              Base64-Kodierung der Bilder
      │                                                 │── POST /v1/messages ──►│
      │                                                 │   model, max_tokens     │
      │                                                 │   images[] + prompt     │
      │                                                 │◄── 200 {content[0].text}│
      │                              JSON-Parsing → RecipeRequest
      │◄── 200 RecipeRequest ───────────────────────────│
      │
      │  Formular wird mit allen Feldern vorbefüllt
      │  User prüft und speichert
```

## Szenario 3: Recipe Match (POST /api/match)

```
Browser             Spring Boot API          Anthropic API
      │
      │── POST /api/match (multipart) ────────────────►│
      │   image: Datei                                  │
      │   model?: string                                │
      │   onlySlots?: boolean                           │
      │                              Alle Recipes laden (oder nur C1–C7)
      │                              formatRecipes() → kompakte Textliste
      │                              ImageUtils.extractExifContext()
      │                              buildPrompt(recipeList, exif)
      │                                                 │── POST /v1/messages ──►│
      │                                                 │   Bild + Prompt         │
      │                                                 │◄── {matches:[{id,reason}]}│
      │                              UUID-Lookup in Recipe-Map
      │◄── 200 [RecipeMatchResponse[3]] ───────────────│
```

## Szenario 4: Kamera-Slot zuweisen (mit Konflikt)

```
Browser             Spring Boot API
      │
      │── PUT /api/recipes/{id}/camera-slot ──────────►│
      │   {slot: "C3", force: false}                    │
      │                              findByCameraSlot(C3) → occupant vorhanden?
      │                              occupant.id != id && !force
      │                              → SlotConflictException
      │◄── 409 {conflictingRecipeId, conflictingRecipeName} ─│
      │
      │  Dialog: "C3 ist bereits von 'Golden Hour' belegt.
      │           Trotzdem zuweisen?"
      │
      │── PUT /api/recipes/{id}/camera-slot ──────────►│
      │   {slot: "C3", force: true}                     │
      │                              occupant.cameraSlot = null (saveAndFlush)
      │                              recipe.cameraSlot = C3 (save)
      │◄── 200 RecipeResponse ──────────────────────────│
```

## Szenario 5: Ähnlichkeits-Map (clientseitig)

```
Browser (SPA)
      │
      │── GET /api/recipes ─────────────────────────────►│
      │◄── 200 Recipe[] (alle Felder) ───────────────────│
      │
      │  Für alle n*(n-1)/2 Paare:
      │    computeSimilarity(a, b) → 0..100
      │
      │  Distanzmatrix D²[i][j] = (1 - sim/100)²
      │
      │  Classical MDS:
      │    Double Centering → Matrix B
      │    Power Iteration (200 Iter.) → Eigenvektor ev1, Eigenwert λ1
      │    Deflation → B₂
      │    Power Iteration → ev2, λ2
      │    Koordinaten: [ev1[i]·√λ1, ev2[i]·√λ2]
      │
      │  SVG Scatter-Plot rendern
      │  Farbe = Filmsimulation, Klick → /recipes/:id
```
