# StayNGo – Next.js Migration Walkthrough

## What Was Built

### 1. Flask JSON API Backend ([app.py](file:///Users/sujalchaudhari/Documents/StayNGo/app.py))
Converted the entire Flask backend from a template-rendering server to a pure REST API:
- Added **CORS** via `flask-cors` (allowing `http://localhost:3000`)
- All routes now return `jsonify(...)` responses
- Added `/api/me` endpoint for session introspection
- Full CRUD for: properties, rooms, amenities, bookings, reviews, payments

### 2. Next.js Frontend (`/frontend/src`)

| File/Folder | Purpose |
|---|---|
| `app/page.tsx` | Login + Register (tabbed, animated) |
| `app/dashboard/page.tsx` | Admin – property list + quick actions |
| `app/user-dashboard/page.tsx` | Guest – browse properties as cards |
| `app/property/[id]/page.tsx` | Property details, rooms, amenities, reviews |
| `app/booking/[roomId]/[propertyId]/page.tsx` | Date picker, payment method, price calc |
| `app/my-bookings/page.tsx` | Guest booking history + cancel |
| `app/admin/add-property/page.tsx` | Add new property form |
| `app/admin/edit-property/[id]/page.tsx` | Edit property (pre-filled) |
| `app/admin/amenities/[propertyId]/page.tsx` | Add / edit / delete amenities |
| `app/admin/rooms/[propertyId]/page.tsx` | Add / edit / delete rooms |
| `app/admin/room-status/[propertyId]/page.tsx` | Read-only room availability overview |
| `components/Navbar.tsx` | Sticky glassmorphism navbar w/ logout |
| `context/AuthContext.tsx` | Auth state from `/api/me` |
| `lib/api.ts` | Axios client + all endpoint helpers |
| `app/globals.css` | Dark design system (navy + amber) |

### 3. Design System
- **Background**: `#09090b` with radial amber glow
- **Surface**: Glassmorphism cards + backdrop-blur
- **Accent**: Amber `#f59e0b` with glow shadows
- **Font**: Inter (Google Fonts)
- **Animations**: Framer Motion fade/slide on all cards

## Visual Proof

![Login Page](/Users/sujalchaudhari/.gemini/antigravity/brain/f47cc0aa-89d8-47d9-bc4c-12b2a3c160bd/home_page_login_1776495237570.png)
*Login page – dark glassmorphism with amber hotel logo and animated tab switching*

## How to Run

### Start Flask Backend (terminal 1):
```bash
cd /Users/sujalchaudhari/Documents/StayNGo
python app.py
```

### Start Next.js Frontend (terminal 2):
```bash
cd /Users/sujalchaudhari/Documents/StayNGo/frontend
npm run dev
```

Access at: **http://localhost:3000**

## Verification Results
- ✅ TypeScript – `npx tsc --noEmit` passes with **0 errors**
- ✅ Next.js 16.2.4 starts in **392ms** 
- ✅ Login page renders with correct premium dark theme
- ✅ Unauthenticated access to `/dashboard` redirects to `/`
- ✅ flask-cors installed and active
