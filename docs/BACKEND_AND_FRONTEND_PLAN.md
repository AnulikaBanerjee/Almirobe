# Almirobe — Backend & Frontend Blueprint

This is the **development blueprint**. Build against this document unless a later decision note overrides it.

**Product:** Almirobe — web first, same API for a future mobile app.  
**Backend:** Java 21 + Spring Boot 3 (monolith).  
**AI:** Python worker (extraction + tagging) — **not** in the Java request path; **not** blocking the add-item form.  
**Frontend:** React 18 + TypeScript + Vite (existing app).

---

## 0. Locked decisions

| Topic | Decision |
|-------|----------|
| Backend language | **Java 21 + Spring Boot 3** |
| Database | **PostgreSQL** + **Flyway** migrations |
| API style | **REST**, versioned **`/api/v1`**, **OpenAPI 3** is the contract |
| Auth (Phase 1) | **Spring Security + JWT** — not Supabase Auth. **Email/password + Continue with Google**. Phone OTP and password-reset email are **Phase 4** |
| Tokens (Phase 1) | Access JWT in **memory**; refresh token in **`localStorage`** (split-origin SPA). Upgrade to httpOnly cookie in Phase 4 |
| Profiles (Phase 1) | **One default profile** created on register or first Google login. `X-Profile-Id` on the API. **No switcher / no add-profile UI** until Phase 2 |
| Files | **S3-compatible object storage** (AWS S3, MinIO local, or Supabase Storage as a bucket only) |
| Process shape | **One monolith**, packages by domain. No microservices until scale/team requires it |
| FE domain persistence | **Resource APIs + TanStack Query** — not snapshot `save(WardrobeData)` over HTTP |
| FE UI state | **React `useState`** — no Redux/Zustand unless a later need is proven |
| FE routing (Phase 1) | Keep **`view` in React state** (`AppView`). Add React Router only when deep links are required |
| Item lists | Load **all items for the active wardrobe**. Paginate **reports** and **activity**, not the open wardrobe |
| Lending (v1) | **Columns on `wardrobe_items`** (`lent_status`, `lent_party`, `lent_date`, `lent_notes`). History table later |
| Wardrobe delete rule | Cannot delete the **last remaining wardrobe**. Optional `is_default` flag. **Do not** hardcode FE seed IDs |
| Image AI | **Python worker, before wardrobe CRUD (Week 2 in this plan).** No crop / corner / straighten UI. Open-source models only. In-browser `@imgly` is **demo/fallback only** |
| Smart tags | **Auto-fill** type, subtype, colour, pattern, weather, occasion, suggested name. User **corrects chips** only if wrong |
| Manual-only fields | **Location** (wardrobe, shelf, loft bag), brand, size, price — filled by **tap or voice**, never guessed |
| Add-item UX | Form + original preview **immediately**. Tags and cutout arrive **in parallel**. Voice works while extraction runs |
| Voice + languages | Speech-to-text for add/edit. Start: **English (India), Hindi, Bengali, Kannada**. Browser Web Speech first; IndicWhisper fallback |
| Scale | Job **queue** + **N workers** (GPU preferred). API returns 202; UI never waits on a spinner that locks the form |
| Google login | **Phase 1.** FE uses Google Identity Services (ID token) → `POST /auth/google`. `GOOGLE_CLIENT_ID` on API + Vite |
| Phone login | **Phase 4.** Hide or disable the phone control in API mode |
| Password reset / email sending | **Phase 4** |
| First deploy | **Docker Compose**: API + Postgres + MinIO + **Redis + Python worker**. Cloud later |
| Demo mode | `VITE_AUTH_PROVIDER=demo` + local snapshot storage — **dev only**, never production |

---

## 1. Current state (repo facts)

| Layer | Today | Problem |
|-------|--------|---------|
| Auth | `DemoAuthProvider` — simulated delay, no persistence | Refresh loses `user` (`useState` only). Google/phone are fake |
| Domain data | `useWardrobeData` loads/saves one `WardrobeData` blob (dev file / localStorage) | No per-entity API, no multi-device sync, last-write-wins on whole snapshot |
| Images | `ImageStorageProvider`: local disk / IndexedDB / optional Supabase upload | No server processing pipeline in production path |
| Business rules | `collections/`, `looks/`, `reports/`, `App.tsx` handlers | Duplicated the moment a second client exists |
| Activity / profiles / service requests | `menu/menuStorage.ts` in localStorage | Not durable, not shared |
| Onboarding | `userPreferences.ts` localStorage key `my-wardrobe-onboarding-v2` | Per-browser only |
| Image AI | `@imgly/background-removal` in the browser | Heavy on phones; quality varies |
| Navigation | `AppView` in `App.tsx` state — **no router library** | Fine for SPA shell; no shareable URLs |
| State libraries | **None** besides React. No Redux, Zustand, or TanStack Query | Server cache will be missing once APIs exist |
| DI Context | `ImageStorageContext` holds a provider instance, not app data | Keep this pattern for API/auth clients |

**Keep:** typed models in `src/types.ts`, provider interfaces, presentation components.

**Do not keep as the production persistence model:** `WardrobeStorageProvider.save(WardrobeData)`.

---

## 2. Target architecture

```
┌─────────────────┐     ┌─────────────────┐
│   React Web     │     │  Mobile App     │
│   TanStack Query│     │  (future)       │
│   + useState UI │     │                 │
└────────┬────────┘     └────────┬────────┘
         │     HTTPS  /api/v1  OpenAPI    │
         └──────────────┬─────────────────┘
                        ▼
              CORS + JWT Bearer
                        ▼
         ┌──────────────────────────────┐
         │  Java API (Spring Boot)      │  stateless
         │  Controllers → Services → JPA│
         └──────┬───────────┬───────────┘
                │           │
       ┌────────▼───┐  ┌────▼────────────┐  ┌──────────────┐
       │ PostgreSQL │  │ Object storage  │  │ Redis queue  │
       └────────────┘  └─────────────────┘  └──────┬───────┘
                                                   │
                              Python workers (scale out)
                              ├─ tagging (Fashion-CLIP + palette)
                              └─ extract (SCHP / rembg / shadow)
```

**Principles**

- API-first: OpenAPI is the contract for web, mobile, and a possible Go rewrite.
- Stateless API: no server sessions; JWT on every request.
- Thin clients: UI and cache only; invariants on the server.
- Bounded contexts in **packages**, not separate deployables.

---

## 3. Frontend state management (blueprint)

### 3.1 Today

| Bucket | Mechanism | Shape |
|--------|-----------|--------|
| Domain snapshot | `useWardrobeData` + `useState` | `collections`, `items`, `looks`, `loftBoxes`, `activeCollectionId` |
| Shell / session | `App.tsx` `useState` | `user`, `view`, welcome/onboarding, which modal is open |
| Ephemeral UI | Child `useState` | Search, filters, forms, door animation, drag |
| Side stores | `localStorage` | Profiles, activity, service requests, onboarding |

### 3.2 Target (locked)

| Kind of state | Library / pattern | Notes |
|---------------|-------------------|--------|
| **Server data** | **TanStack Query v5** | Wardrobes, items, looks, loft, reports, activity, image jobs |
| **UI / shell** | **React `useState`** (and local component state) | Modals, `view`, filters, forms, drag overlay |
| **Auth session** | Small **AuthContext** + memory access token | `user`, `accessToken`, `activeProfileId`; refresh token in `localStorage` |
| **DI** | React Context | `ApiClient`, `AuthProvider` impl, image/media helper — same idea as `ImageStorageContext` |
| **Not used** | Redux, Zustand, Recoil, Jotai | Do not add unless Query + Context is proven insufficient |

### 3.3 Query keys and invalidation (required)

```
['auth', 'me']
['profiles']
['wardrobes']
['wardrobes', wardrobeId]
['items', { wardrobeId }]
['looks']
['loft', 'boxes']
['reports', 'purchases']
['reports', 'wear']
['reports', 'declutter']
['activity']
['preferences']               # includes uiLocale
['image-jobs', jobId]         # poll: tags then cutout
```

**Rules**

- Mutation on an item invalidates `['items', { wardrobeId }]` and any detail query for that item.
- Delete wardrobe invalidates `['wardrobes']` and that wardrobe’s items.
- Look mutations invalidate `['looks']`.
- Image job: `refetchInterval` while `tagsStatus` or `cutoutStatus` is `queued`/`processing`. Invalidate item query when cutout URL lands.
- Optimistic UI is allowed for favorite/laundry toggles; rollback on error.

### 3.4 What happens to `useWardrobeData`

| Environment | Persistence |
|-------------|-------------|
| **Production / API mode** | **Remove** snapshot save. Feature hooks + TanStack Query only |
| **Demo / offline UI work** | Keep `useWardrobeData` + `DevFileStorageProvider` / localStorage behind `VITE_AUTH_PROVIDER=demo` |

Do **not** implement `JavaApiStorageProvider` that PUTs the entire `WardrobeData` blob.

### 3.5 `App.tsx` after cleanup

`App.tsx` owns: auth gate, welcome/onboarding, `view`, which modal is open, layout.  
It does **not** own: cascade deletes, look member rules, wear counts, report aggregation, packing math.

---

## 4. Backend services (Java monolith)

Package layout:

```
com.almirobe
├── api/v1/           # REST controllers, DTOs, OpenAPI
├── auth/
├── profile/
├── wardrobe/
├── item/
├── look/
├── loft/
├── media/
├── report/
├── activity/
├── preference/
├── servicerequest/
├── common/           # errors, pagination, ids, clock
└── infrastructure/   # JPA, S3, Redis queue
```

| Module | Responsibility | Phase |
|--------|----------------|-------|
| Auth | Register, login, Google ID-token login, refresh, logout, `/me` | 1 |
| Profile | Default profile on register/Google; `X-Profile-Id` on requests | 1 default only; **create extra profiles + switcher in Phase 2** |
| Wardrobe | CRUD collections/categories/display settings | 1 |
| Item | CRUD, favorite, laundry, donation, shelf, wear, lending fields | 1 CRUD; flags in 2 |
| Look | CRUD, primary item, cascade when item deleted | 1 |
| Media | Presigned upload, confirm, store URLs | **Week 2** (with vision) |
| Image processing | Jobs + Python workers (extract ∥ tags) | **Week 2** — **before** wardrobe CRUD |
| Tagging | Persist suggested + confirmed tags on item | Week 2 |
| Voice / i18n | Locale + STT fallback endpoint | Week 2 (UI); worker STT optional same week |
| Loft | Boxes, pack/unpack | Phase 2 |
| Activity | Audit log | Phase 2 |
| Preferences | Onboarding, UI locale, voice language | Week 2 locale; rest Phase 2 |
| Report | Purchase, wear, declutter aggregations | Phase 2 |
| Service request | Stylist / donation pickup | Phase 2 |

---

## 5. API contract (`/api/v1`)

All authenticated routes require `Authorization: Bearer <access>`.  
Mutations that touch wardrobe data also require **active profile** (`X-Profile-Id` header). Server rejects mismatch with 403.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Profiles | Phase 1: `GET /profiles` (the default). Phase 2: `POST /profiles`, `PATCH /profiles/{id}` |
| Wardrobes | `GET/POST /wardrobes`, `GET/PATCH/DELETE /wardrobes/{id}` |
| Items | `GET/POST /wardrobes/{id}/items`, `GET/PATCH/DELETE /items/{id}` |
| Item actions | `POST /items/{id}/laundry`, `POST /items/{id}/donate`, `POST /items/{id}/worn`, `POST /items/{id}/lend` |
| Looks | `GET/POST /looks`, `GET/PATCH/DELETE /looks/{id}` |
| Loft | `GET/POST /loft/boxes`, `PATCH/DELETE /loft/boxes/{id}`, `POST /loft/boxes/{id}/pack`, `POST /items/{id}/unpack` |
| Media | `POST /media/upload-url`, `POST /media/confirm`, `GET /media/{id}` |
| Image jobs | `POST /image-jobs` (original upload confirmed), `GET /image-jobs/{id}` returns **independent** `tags` and `cutout` status |
| Speech | `POST /speech/transcribe` (optional fallback when browser STT unavailable) |
| Reports | `GET /reports/purchases`, `GET /reports/wear`, `GET /reports/declutter` |
| Reports | `GET /reports/purchases`, `GET /reports/wear`, `GET /reports/declutter` |
| Activity | `GET /activity?cursor=&limit=` |
| Preferences | `GET/PATCH /preferences` |
| Service requests | `POST /service-requests`, `GET /service-requests` |

**Conventions**

- JSON, ISO-8601 timestamps, UUID ids.
- `409` on stale `updatedAt` (optimistic lock) for item/wardrobe/look PATCH.
- `POST /media/upload-url` and `POST /image-jobs` accept **`Idempotency-Key`**.
- Image job payload streams two tracks: `tagsStatus` / `tags` and `cutoutStatus` / `processedUrl` / `candidates[]` (multi-garment).
- List items: `GET /wardrobes/{id}/items` returns the **full set** for that wardrobe (not globally paginated).
- Reports/activity: cursor or offset pagination (`limit` default 50, max 200).
- Errors: `{ "code": "ITEM_NOT_FOUND", "message": "..." }`.
- Publish `openapi.yaml`; generate TypeScript types in CI.

**NFR:** loose coupling, portability, multi-client.

---

## 5A. Automatic extraction, tagging, and voice (before Week 2 CRUD)

**Goal:** Match other wardrobe apps: user photographs an item, the app **fills almost everything**, user **confirms**. No crop, no corners, no straighten UI.

### 5A.1 Reduce manual work (locked)

| Field | Source | User action |
|-------|--------|-------------|
| Cutout image | Python extract | None (preview swaps in) |
| If several garments | Parsing regions | **Tap which to add** (default: all high-confidence) |
| Product type | Fashion-CLIP + SCHP | Edit chip only if wrong |
| Subtype | CLIP vs fixed vocab | Edit chip only if wrong |
| Colour + `colorHex` | Palette on pixels | Edit only if wrong |
| Pattern | CLIP | Edit chip only if wrong |
| Weather / season | CLIP + rules (India: summer / monsoon / winter / all) | Edit chip only if wrong |
| Occasion | CLIP + rules (office / party / house / casual / ethnic) | Edit chip only if wrong |
| Suggested name | Template from type+colour | Edit if desired |
| **Wardrobe, shelf, loft bag** | **User** | Tap or **voice** — never inferred |
| Brand, size, price | User | Voice or skip (optional) |

**No manual:** crop, rotate, warp, pick background, draw mask.

### 5A.2 Parallel UX (never lock the form)

```
Photo selected
    → Add-item screen NOW (original as preview)
    → Voice + location chips available immediately
    ├─ Job A: tags   (Fashion-CLIP + colour on thumbnail)  → chips populate
    └─ Job B: extract (SCHP / rembg / auto-crop / shadow)  → image replaces preview
```

- User may save **before** cutout: store `originalUrl` + `jobId`; worker patches `imageUrl` when done.
- Refine colour from cutout when B finishes (silent, no extra form).
- Poll `GET /image-jobs/{id}` until both tracks complete (or timeout with original kept).

**Latency targets (GPU worker, models loaded):**

| Event | Target |
|-------|--------|
| Form + preview | **0s** |
| First tags | **< 1s** typical |
| Cutout on screen | **1–3s** typical |
| Busy queue | Form still usable; “Cutout in progress” on the card |

Do **not** wait 2–8s on a blocking spinner. That estimate was sequential CPU; the product must feel instant via parallelism + async jobs.

### 5A.3 Models (open source, self-hosted)

| Track | Model | Notes |
|-------|--------|--------|
| Person vs flat lay | SCHP-ATR or fashn-human-parser | If no person, skip parse |
| Garment pixels | rembg **u2net_cloth_seg** and/or **BiRefNet-general** | Keep weights loaded |
| Auto geometry | Tight crop from mask + small PCA rotate | **Not** interactive perspective |
| Shadow | Port of `compositeForWardrobe` in Python | White-on-white visibility |
| Type / subtype / occasion | **Fashion-CLIP** vs **fixed Indian wardrobe vocabulary** | No free-text hallucination |
| Colour | k-means on mask / thumbnail | No neural net |

**Not default:** 8B vision LLMs (slow, expensive). Revisit only if CLIP accuracy is insufficient.

**Paid APIs (PhotoRoom etc.):** optional A/B later — **not** required.

### 5A.4 Vocabulary (v1 — extend later)

Keep lists in **one JSON** shared by worker + FE chips (OpenAPI enum or `GET /catalog/tags`).

- **Types:** shirt, t-shirt, kurta, kurti, saree, dress, jeans, formal-pant, half-pant, skirt, jacket, sweater, shoes, sandals, heels, sneakers, bag, jewellery, other  
- **Shirt subtypes:** full-sleeve, half-sleeve, sleeveless, chinese-collar, collar, round-neck, v-neck  
- **Pant subtypes:** formal, jeans, chinos, half-pant, jeggings  
- **Shoe subtypes:** sneakers, formal, sandals, heels, kolhapuri, sports  
- **Occasion:** office, party, house, casual, ethnic, festive  
- **Weather:** summer, monsoon, winter, all  

Worker returns `{ value, confidence }`. FE auto-selects if confidence ≥ 0.55; otherwise show top 3 chips.

### 5A.5 Voice and languages

| Locale | Code |
|--------|------|
| English (India) | `en-IN` |
| Hindi | `hi-IN` |
| Bengali | `bn-IN` |
| Kannada | `kn-IN` |

**Primary STT:** browser **Web Speech API** (zero extra cost, low latency).  
**Fallback:** `POST /speech/transcribe` → **IndicWhisper / faster-Whisper** on a worker.

Voice maps phrases to fields (reduce typing): type, colour, occasion, weather, wardrobe name, shelf number, loft bag, brand, size.  
Example: *“blue jeans, ghar, pehle almari, teesri shelf”* → tags + location.

UI chrome (add-item, chips, mic button) is translated for the four locales (`uiLocale` in preferences). Default `en-IN`.

### 5A.6 Scale

```
POST /image-jobs  → 202 { jobId }
Redis (or DB) queue
Worker pool — replica count scales with queue depth
```

- One HTTP request never runs rembg on the API JVM.  
- Horizontal scale = more Python workers (GPU first; CPU acceptable for low traffic).  
- Keep models in memory (no per-request load).  
- Optional GPU batching when queue &gt; 1.

**NFR:** availability (API stays fast), scalability (workers ≠ API), low perceived latency (parallel tracks).

---

## 6. Domain: FE vs BE

### 6.1 Backend owns (source of truth)

| Rule | Today in FE | Server |
|------|-------------|--------|
| Delete wardrobe + cascade items/looks | `deleteCollectionState()` | Wardrobe service + DB transaction |
| Look primary promotion on item delete | `removeItemFromLooks()` | Look service |
| Cannot delete last wardrobe | `canDeleteCollection()` + seed IDs | Count + `is_default` |
| Mark worn / wear count | `markItemWornToday()` | `POST /items/{id}/worn` |
| Pack / unpack loft | `App.tsx` | Loft service |
| Donation queue | `App.tsx` | Item service |
| Reports | `src/reports/*` | Report service |
| Activity | `menuStorage.addActivity()` | Activity service |
| Service requests | `menuStorage` | Service request service |
| Onboarding | `userPreferences.ts` | Preferences service |
| Auth / profiles | demo + localStorage | Auth + Profile services |
| Image URLs in production | local providers | Media + extract job |
| Type, colour, occasion, weather | none / manual form | Python tagging track |
| Cutout | `@imgly` in browser | Python extract track |

### 6.2 Frontend keeps

| Concern | Examples |
|---------|----------|
| UI state | Modals, `view`, drag overlay, door animation |
| Instant form checks | Required fields; **server re-validates** |
| Filters on loaded wardrobe items | Search, season chip, favorites — client filter of that wardrobe’s list |
| Charts | `SimpleBarChart` / `SimplePieChart` — **data from Report API** |
| Optimistic toggles | Favorite / laundry with Query rollback |
| Voice fill | Mic on add/edit; maps to chips + location |
| Locale | `en-IN` / `hi-IN` / `bn-IN` / `kn-IN` |
| Phase 1 image preview | Original photo immediately; cutout when job B done |

### 6.3 Shared contract only

- Generated OpenAPI TS types.
- Display helpers: `SEASON_LABELS`, icons, date format.
- FE may hide “Delete” if API returns `deletable: false`; the **server still enforces** it.

---

## 7. Frontend cleanup phases

### Phase A — API client (no snapshot-over-HTTP)

| Step | Action | NFR |
|------|--------|-----|
| A1 | `src/api/ApiClient` — base URL, Bearer, 401 → refresh, error mapping | Loose coupling |
| A2 | `JavaAuthProvider` + `AuthContext` (session restore via refresh). Wire **Continue with Google** to GIS → `POST /auth/google`. Hide phone in API mode | Stateless client, durable session |
| A3 | Generate TS types from OpenAPI | Maintainability |
| A4 | Env: `VITE_API_BASE_URL`, `VITE_AUTH_PROVIDER=api\|demo` | Deployability |
| A5 | Add **TanStack Query** `QueryClientProvider` in `main.tsx` | Cache, retries |

**Explicitly out of scope:** `JavaApiStorageProvider` wrapping `load`/`save` of `WardrobeData`.

### Phase B — Thin App + domain hooks

| Step | Action | NFR |
|------|--------|-----|
| B1 | `useWardrobes`, `useItems(wardrobeId)`, `useLooks`, `useLoft` via Query | Separation |
| B2 | Mutations in `src/features/*/api.ts` (or similar) — HTTP only | Testability |
| B3 | Remove production use of `collectionActions` / `lookActions` / `wearTracking` as **writers**; charts consume report DTOs | Single source of truth |
| B4 | Stop bulk snapshot persist in API mode | Consistency, performance |
| B5 | Report pages: `usePurchaseReport()` etc. | Scale (aggregation on server) |

### Phase C — Media + vision (do **before** full item CRUD polish)

| Step | Action | NFR |
|------|--------|-----|
| C1 | Presigned upload of **original**; enqueue image job | Security, scale |
| C2 | Poll job: tags track then cutout track | Perceived performance |
| C3 | Optional multi-garment picker (tap to include) | Less typing than crop |
| C4 | IndexedDB / local disk / in-browser rembg **demo only** | Reliability |

### Phase D — Remove local-only production paths

| Step | Action | NFR |
|------|--------|-----|
| D1 | Production build must not write `data/wardrobe-data.json` or wardrobe localStorage | Simplicity |
| D2 | Activity + service requests via API | Durability |
| D3 | Preferences via API | Multi-device |
| D4 | Demo provider compile/runtime flag only | Security |

---

## 8. Backend build phases

### Phase 1 — Foundation

1. Spring Boot, PostgreSQL, Flyway, CORS for Vite origin  
2. Auth: register, email/password login, **Google ID-token login**, refresh, logout, `/me`  
3. Default profile on register **and** first Google login (same email as an existing account **links** Google `sub`, does not create a duplicate user)  
4. Wardrobe + Item + Look CRUD + delete cascades  
5. Media presigned upload of **original** (cutout is worker output)  
6. OpenAPI + Swagger  
7. Integration tests: last-wardrobe delete blocked; item delete updates looks; Google login issues JWT  

**NFR:** statelessness, security (auth + profile scope), portability, multi-client.

### Phase 1.5 — Vision (immediately after auth, **before** wardrobe/item UI migration)

1. Redis + Python worker in Docker Compose  
2. Dual-track jobs: tags ∥ extract  
3. Fashion-CLIP vocabulary + colour palette  
4. SCHP / rembg / auto-crop / shadow  
5. FE add-item: never block; voice + 4 locales  
6. Optional `POST /speech/transcribe` fallback  

**NFR:** perceived latency, availability, scale workers independently.

### Phase 2 — Workflows

1. Extra profiles: create / rename + **profile switcher** in the UI  
2. Loft pack/unpack  
3. Laundry, donation, lending, worn  
4. Activity  
5. Preferences / onboarding  
6. Reports  
7. Service requests  

**NFR:** maintainability, transactions, indexed queries.

### Phase 4 — Harden

1. Rate limits, validation, structured logs, Micrometer, health  
2. Backups  
3. CI/CD  
4. Phone OTP; password-reset email  
5. Refresh token → httpOnly cookie if API is same-site or behind a gateway  
6. Secrets manager, HTTPS only  

**NFR:** observability, reliability, security.

---

## 9. Database (PostgreSQL)

```
users                    id, email unique, password_hash nullable, google_sub unique nullable,
                         created_at, updated_at
refresh_tokens           id, user_id, token_hash, expires_at, revoked_at
profiles                 id, user_id, label, display_name, created_at, updated_at
wardrobe_collections     id, profile_id, name, icon, display_mode, shelf_count,
                         enable_season_filter, is_default, created_at, updated_at
wardrobe_categories      id, collection_id, label, sort_order
wardrobe_items           id, profile_id, collection_id, category_id, name, color,
                         color_hex, brand, size, season, notes, image_url,
                         original_image_url, product_type, subtype, pattern,
                         occasion, weather, tag_confidence jsonb,
                         shelf_index, favorite, in_laundry, marked_for_donation,
                         donation_marked_at, loft_box_id, lent_status, lent_party,
                         lent_date, lent_notes, purchase_price, purchase_date,
                         last_worn_at, wear_count, created_at, updated_at
looks                    id, profile_id, name, primary_item_id, notes, created_at, updated_at
look_items               look_id, item_id, sort_order  PK (look_id, item_id)
loft_boxes               id, profile_id, name, image_url, notes, created_at, updated_at
media_assets             id, profile_id, original_url, processed_url, status, created_at
image_processing_jobs    id, media_id, tags_status, cutout_status, tags jsonb,
                         processed_url, candidates jsonb, error, idempotency_key unique,
                         created_at, updated_at
activity_entries         id, profile_id, title, detail, created_at
user_preferences         profile_id, key, value  PK (profile_id, key)
service_requests         id, profile_id, type, status, payload jsonb, created_at
```

**Preference keys** include `uiLocale` and `voiceLocale` (`en-IN` | `hi-IN` | `bn-IN` | `kn-IN`).

**Indexes:** `profile_id` on collections/items/looks/loft/activity; `collection_id` on items; `loft_box_id` on items.

**Constraints:** FK on `looks.primary_item_id`; deleting an item removes `look_items` rows and repairs or deletes empty looks **in one transaction**.

**NFR:** consistency, performance, auditability (`updated_at`).

---

## 10. Security & operations (Phase 1 minimum)

| Topic | Rule |
|-------|------|
| CORS | Allow Vite origin with `Authorization` header; credentials only if cookies are used later |
| Google | Verify ID token with Google JWKS + `GOOGLE_CLIENT_ID`. FE `VITE_GOOGLE_CLIENT_ID` must match |
| Passwords | BCrypt (or Argon2) — never store plaintext. Nullable for Google-only users |
| JWT access | Short-lived (e.g. 15 min) |
| Refresh | Rotate on use; revoke on logout |
| Authorization | Every query filtered by `user_id` → `profile_id`; never trust client-supplied owner ids without check |
| Uploads | Presigned PUT; confirm only if object exists; content-type allowlist (jpeg/png/webp) |
| Secrets | `.env` / env vars; never commit keys |

---

## 11. NFR map

| Decision | NFRs |
|----------|------|
| REST `/api/v1` + OpenAPI | Loose coupling, portability, multi-client |
| JWT, no server session | Statelessness, horizontal scale |
| PostgreSQL + Flyway | Consistency; DB survives a Go rewrite |
| Presigned object storage | Scale, API stays small |
| Monolith + domain packages | Maintainability, speed of delivery |
| TanStack Query | FE cache, retries, job polling |
| Dual-track image jobs | Perceived latency; form never blocked |
| Redis + Python worker pool | Throughput as users grow |
| Fashion-CLIP + palette (not 8B VLM) | Cost, latency |
| No snapshot HTTP save | Consistency, concurrency |
| Items by wardrobe (full list) | UX performance; avoids over-pagination |
| Queue + Python workers | Availability, scale |
| Voice + 4 locales | Accessibility |
| Profile-scoped rows | Security |
| `updatedAt` on PATCH | Concurrent edit safety |
| Idempotency-Key on uploads/jobs | Reliability |
| Demo flag off in production | Security |

---

## 12. Execution order (realistic solo)

Treat as **14–18 weeks**, not 8–10. Overlap BE/FE by contract-first (OpenAPI stub in week 1).  
**Week 1 is done.** Next is vision (not wardrobes).

| Week | Backend | Frontend |
|------|---------|----------|
| 1 | **Done:** Auth (email + Google), Flyway, `/me` | **Done:** Query, `ApiClient`, `AuthContext` |
| **2** | Redis + Python workers; dual-track `image-jobs`; tag + extract models; optional STT | Add-item **unlocked**: original preview, tag chips as they arrive, voice (`en-IN` `hi-IN` `bn-IN` `kn-IN`), no crop UI |
| 3 | Default profile + Wardrobes | `useWardrobes`, location chips bind to real wardrobes |
| 4 | Items CRUD + persist auto tags + `updatedAt` | `useItems`; save allowed before cutout completes |
| 5 | Looks + cascade tests | Looks gallery/editor via API |
| 6 | Item actions: laundry, donate, worn, lend | Wire `App.tsx` handlers to mutations |
| 7 | Loft | Loft page + bag as location target |
| 8 | Reports + activity + onboarding prefs | Report pages + onboarding flag |
| 9 | Service requests; harden validation | Remove `menuStorage` from API mode |
| 10 | Test coverage, Compose: API+Postgres+MinIO+Redis+worker | Strip production local snapshot + in-browser rembg |
| 11–12 | Buffer / GPU tuning / extra workers | Buffer / UX |
| Later | Phase 4 phone OTP, password reset, cookie refresh | — |

---

## 13. Definition of done

- [ ] No domain writers left in `App.tsx` (orchestration only)
- [ ] Production does not use `useWardrobeData` snapshot save
- [ ] `collectionActions` / `lookActions` / `wearTracking` are not the source of mutations in API mode
- [ ] Production does not persist wardrobe JSON in localStorage or `data/wardrobe-data.json`
- [ ] Session survives refresh (`GET /auth/me` or refresh token)
- [ ] Email/password and **Continue with Google** both issue JWTs in API mode
- [ ] All mutations authenticated and profile-scoped
- [ ] Phase 1 uses a **single default profile** (no switcher until Phase 2)
- [ ] OpenAPI published; TS types generated in CI
- [ ] Integration tests: last wardrobe cannot be deleted; item delete repairs looks
- [ ] Add-item never blocks on extraction; tags and cutout are independent job tracks
- [ ] No crop / corner / straighten UI in production
- [ ] Auto tags: type, subtype, colour, weather, occasion; location is user/voice only
- [ ] Voice STT for `en-IN`, `hi-IN`, `bn-IN`, `kn-IN` (browser first)
- [ ] Media originals (and processed variants) in object storage
- [ ] TanStack Query used for server state; UI state remains React local state
- [ ] Demo provider cannot be selected in the production build (or is clearly non-secret)

---

## 14. Explicit non-goals (Phase 1)

- Microservices
- GraphQL
- Redux/Zustand
- Snapshot sync API
- Blocking spinner until cutout finishes
- Manual crop / perspective UI
- PhotoRoom (or other paid vision) as the production path
- Phone OTP
- Password-reset email
- Extra profiles / profile switcher (Phase 2)
- React Router
- Multi-region
- Real-time websockets (polling is enough for jobs)

---

## 15. Product decisions (locked 13 Sep 2026)

| # | Decision |
|---|----------|
| D1 | **Phase 1:** one default profile per account. **Phase 2:** add-profile + switcher (Me / Partner / Family) |
| D2 | First run: **Docker Compose** (API + Postgres + MinIO + Redis + Python worker). Cloud later |
| D3 | **Python worker** for extraction + tags **before** wardrobe UI (Week 2). In-browser rembg is demo/fallback only |
| D4 | Navigation stays **in-app `view` state**. No React Router in Phase 1 |
| D5 | **No password reset** until Phase 4. **Continue with Gmail is Phase 1** |
| D6 | Dual-track jobs: tags ∥ extract; form + voice stay usable |
| D7 | Auto-tag visual attributes; **location / brand / size / price** are user or voice |
| D8 | Locales v1: `en-IN`, `hi-IN`, `bn-IN`, `kn-IN` |

This document is the blueprint. **Week 1 is complete.** Next: **Week 2** (section 12) — Python workers, dual-track image jobs, auto tags, voice + four languages.
