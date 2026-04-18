# StayNGo – Next.js Frontend Migration

Migrate the existing Flask+Jinja2 HTML frontend to a modern **Next.js 15** app using **Tailwind CSS v4**, **shadcn/ui**, and **Framer Motion**, while keeping the Flask Python backend untouched except for converting it from a template-rendering server into a JSON REST API.

## User Review Required

> [!IMPORTANT]
> The Flask backend will be modified to return JSON from all routes instead of rendering Jinja2 templates. The old `/templates` directory and `/static/styles.css` remain in place but are no longer served. The Next.js app will live in a new `/frontend` sub-directory and proxies API calls to Flask (port 5000) during development.

> [!WARNING]
> This migration replaces ALL 15 Jinja2 templates with Next.js pages. You will need to run **two servers** during development: Flask on port 5000 and Next.js on port 3000. For production the Next.js build can be exported as static files or deployed separately.

---

## Proposed Changes

### Backend – Flask API Conversion

#### [MODIFY] [app.py](file:///Users/sujalchaudhari/Documents/StayNGo/app.py)
- Add `flask-cors` and `flask-session` (or keep cookie session) to enable cross-origin requests from Next.js dev server.
- Replace every `render_template(...)` call with `jsonify(...)`.
- Replace every `redirect(url_for(...))` with a `jsonify({"redirect": "<path>"})` or appropriate success/error JSON.
- Replace `flash(...)` calls with JSON `{"message": "...", "status": "success"|"error"}`.
- Add `GET /api/me` endpoint that returns current session user info.
- Keep session-based auth on every route (no JWT needed for now).

#### [MODIFY] [requirements.txt](file:///Users/sujalchaudhari/Documents/StayNGo/requirements.txt)
- Add `flask-cors`.

---

### Frontend – Next.js App

#### [NEW] `frontend/` directory
Bootstrap with:
```
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Key packages to install:
| Package | Purpose |
|---|---|
| `shadcn/ui` (via CLI) | Prebuilt accessible components |
| `framer-motion` | Page transitions & micro-animations |
| `lucide-react` | Icon set |
| `axios` | HTTP client for Flask API calls |
| `sonner` | Toast notifications (replaces flash) |

#### [NEW] `frontend/src/lib/api.ts`
Axios instance pre-configured with `baseURL=http://localhost:5000`, `withCredentials: true` (so Flask session cookie is sent).

#### [NEW] `frontend/src/components/` – Shared UI components
- `Navbar.tsx` – top nav with logo, user name, role badge, logout button
- `FlashToast.tsx` – wraps `sonner` Toaster
- `PropertyCard.tsx` – card UI for property listings (used in both dashboards)
- `RoomCard.tsx` – card UI for rooms in view_more
- `StarRating.tsx` – star rating display component

#### [NEW] Pages (all under `frontend/src/app/`)

| Old Flask route | New Next.js page |
|---|---|
| `/` (index.html) | `app/page.tsx` – Login & Register |
| `/dashboard` (admin) | `app/dashboard/page.tsx` |
| `/user_dashboard` | `app/user-dashboard/page.tsx` |
| `/view_more/<id>` | `app/property/[id]/page.tsx` |
| `/book_room/<rid>/<pid>` | `app/booking/[roomId]/[propertyId]/page.tsx` |
| `/my_bookings` | `app/my-bookings/page.tsx` |
| `/add_property` | `app/admin/add-property/page.tsx` |
| `/edit_property/<id>` | `app/admin/edit-property/[id]/page.tsx` |
| `/add_amenities/<id>` | `app/admin/amenities/[id]/page.tsx` |
| `/view_amenities/<id>` | `app/admin/amenities/[id]/page.tsx` (same, tabs) |
| `/edit_amenity/<id>` | `app/admin/edit-amenity/[id]/page.tsx` |
| `/view_rooms/<id>` | `app/admin/rooms/[id]/page.tsx` |
| `/add_room/<id>` | `app/admin/rooms/[id]/page.tsx` (modal/drawer) |
| `/edit_room/<id>` | `app/admin/edit-room/[id]/page.tsx` |
| `/room_status/<id>` | `app/admin/room-status/[id]/page.tsx` |

#### [NEW] `frontend/next.config.ts`
Add API proxy rewrites so `/api/*` → `http://localhost:5000/*`.

---

### Design System

**Color palette** – deep navy + amber accent, glassmorphism cards:
- Background: `#0a0f1e` (deep navy)
- Surface: `rgba(255,255,255,0.06)` with backdrop blur
- Accent: `#f59e0b` (amber-500)
- Text: `#f1f5f9` (slate-100)

**Typography**: `Inter` (Google Fonts via `next/font`)

**Motion**: `AnimatePresence` wraps each page; cards animate in with `y: 20 → 0, opacity: 0 → 1`.

---

## Verification Plan

### Automated Tests
- No existing test suite was found in the repo.
- After build, run `npm run build` inside `/frontend` to ensure no TypeScript errors:
  ```bash
  cd /Users/sujalchaudhari/Documents/StayNGo/frontend
  npm run build
  ```

### Manual Verification (Browser)
1. Start Flask: `cd /Users/sujalchaudhari/Documents/StayNGo && python app.py`
2. Start Next.js dev server: `cd frontend && npm run dev`
3. Open `http://localhost:3000` – verify Login/Register page renders with premium dark UI.
4. Register a new user → should redirect to user dashboard.
5. Login as guest → verify property cards are shown.
6. Click "View More" on a property → verify rooms, amenities, reviews.
7. Book a room → verify booking confirmation.
8. Login as admin → verify dashboard with property table.
9. Add a property → fill form → verify redirect to amenities.
10. Logout → verify redirect to login page.
