# Prophet Victor A.Y. – Global Seekers Chapel
## Architecture, Deployment & Security Guide

---

## 1. Project Architecture

```text
/
├── server.ts                              # Express API entry point, Helmet, CORS, Sitemap, Robots.txt
├── scripts/
│   └── setup-admin.ts                     # Secure CLI tool to create/reset the administrator account
├── server/
│   ├── config/
│   │   ├── env.ts                         # Validated environment variables & HTTP-only cookie options
│   │   ├── database.ts                    # MongoDB Atlas Mongoose connection & initial admin bootstrap
│   │   └── cloudinary.ts                  # Signed Cloudinary upload parameters & asset deletion
│   ├── middleware/
│   │   └── security.ts                    # Session auth, RBAC, CSRF verification, NoSQL/XSS sanitiser, rate limiters
│   ├── models/
│   │   └── index.ts                       # 15 Mongoose models with indexes, timestamps & validation
│   ├── services/
│   │   └── mediaService.ts                # Cross-collection reference counting before Cloudinary deletion
│   ├── validators/
│   │   └── schemas.ts                     # Strict Zod validation schemas for all API endpoints
│   └── routes/
│       ├── authRoutes.ts                  # /api/auth/* (session, login, logout, account security)
│       ├── publicRoutes.ts                # /api/public/* (published reads & write-only private forms)
│       └── adminRoutes.ts                 # /api/admin/* (protected CRUD & signed media endpoints)
└── src/
    ├── context/                           # ThemeContext, SiteDataContext, AuthContext
    ├── lib/                               # REST API client (CSRF-aware), Cloudinary responsive srcSet & YouTube helpers
    ├── components/
    │   ├── common/                        # SeoHead, MotionPrimitives, ManagedImage
    │   ├── public/                        # PublicLayout, HeroSlider
    │   └── admin/                         # CloudinaryImageInput, SliderManager, CRUD & Settings managers
    └── pages/
        ├── public/                        # Home, About, Sermons, Events, Books, Gallery, Testimonies, Blog, Prayer, Contact
        └── admin/                         # Private /admin portal (Login, 403 Gate, 17-item CMS Dashboard)
```

---

## 2. MongoDB Atlas Configuration

1. Create a cluster in **MongoDB Atlas** (M0 Free or Dedicated production tier).
2. Under **Database Access**, create a **least-privilege database user** granted `readWrite` strictly on your ministry database (e.g. `global_seekers_chapel`), not `atlasAdmin`.
3. Under **Network Access**, allow your backend hosting provider's outbound IPs (or `0.0.0.0/0` temporarily if deploying on dynamic serverless/container IPs with strong TLS credentials).
4. Set the Atlas connection string in your `.env` or hosting platform's secret manager under `MONGODB_URI` (never commit `.env` to Git):
   ```env
   MONGODB_URI=""
   ```

---

## 3. Cloudinary Configuration

1. Create a **Cloudinary** account and copy **Cloud Name**, **API Key**, and **API Secret** from the Cloudinary Console.
2. Add them strictly to backend environment variables (never prefix `CLOUDINARY_API_SECRET` with `VITE_`):
   ```env
   CLOUDINARY_CLOUD_NAME=""
   CLOUDINARY_API_KEY=""
   CLOUDINARY_API_SECRET=""
   ```
3. All uploads use **server-generated cryptographic signatures** (`/api/admin/media/sign-upload`) restricted to `jpg, jpeg, png, webp, avif` under the `gsc/*` folder namespace, up to `10 MB`.
4. Whenever an image is replaced or its record is deleted, `mediaService.ts` checks all MongoDB collections first so an image still referenced elsewhere is never deleted.

---

## 4. Initial Administrator Account Setup

There is **no public registration endpoint**. Provision the pastor's administrator account using either method:

### Option A: Automatic First-Boot Provisioning
Set the following in your private backend environment variables before starting the server (used only when `admins` collection has `0` documents):
```env
ADMIN_EMAIL=""
ADMIN_INITIAL_PASSWORD=""
ADMIN_DISPLAY_NAME="Prophet Victor A.Y."
```
Once provisioned, remove `ADMIN_INITIAL_PASSWORD` from the environment variables and manage credentials inside `/admin` -> **Account Settings**.

### Option B: CLI Provisioning Script
Populate `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_INITIAL_PASSWORD` in your local `.env` (which is ignored by Git) and run:
```bash
npm run setup-admin
```

---

## 5. Deployment Instructions

### Backend Deployment (Render / Railway / Fly.io / Google Cloud Run)
1. Deploy the repository as a Node.js 22+ web service.
2. Set environment variables:
   - `NODE_ENV="production"`
   - `MONGODB_URI`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `SESSION_SECRET` (generate with `openssl rand -hex 32`)
   - `FRONTEND_URL="https://www.yourdomain.com"`
   - `COOKIE_SAME_SITE="none"` (if frontend on Vercel and API on a separate domain) or `"lax"` (if unified domain / reverse-proxied under `/api`).
3. Start command: `npm start` (`node server.ts`).

### Frontend Deployment (Vercel)
1. Import the repository into **Vercel** (Framework Preset: **Vite**, Build Command: `npm run build`, Output Directory: `dist`).
2. Recommended unified domain routing (`vercel.json` rewrite) so HTTP-only `SameSite=Lax` cookies work seamlessly on first-party domain:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://api.yourdomain.com/api/:path*" },
       { "source": "/sitemap.xml", "destination": "https://api.yourdomain.com/sitemap.xml" },
       { "source": "/robots.txt", "destination": "https://api.yourdomain.com/robots.txt" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   *(Alternatively, set `VITE_API_BASE_URL="https://api.yourdomain.com"` in Vercel Environment Variables).*

---

## 6. Production Security Checklist

- [x] **Password Hashing**: `bcryptjs` (12 work-factor rounds) + dummy hash comparison on unknown emails to prevent timing enumeration.
- [x] **Brute-Force Protection**: IP rate limiting (`express-rate-limit`) on `/api/auth/login` AND per-account lockout (`lockUntil` 15 minutes after 5 failed attempts).
- [x] **Server-Side Sessions & HTTP-Only Cookies**: Cryptographically random session tokens stored as HMAC-SHA256 hashes in MongoDB (`adminSessions` with automatic TTL expiration) and delivered via `HttpOnly` cookies.
- [x] **CSRF Protection**: Synchronizer `X-CSRF-Token` verified via `crypto.timingSafeEqual` on every mutating administrative request.
- [x] **Strict RBAC & Private Data Isolation**: Prayer requests and ministry enquiries are write-only for public visitors and readable strictly by verified administrators.
- [x] **Input Validation & Sanitisation**: Zod schemas on all endpoints + recursive NoSQL `$` / dotted-key stripping + script/event-handler XSS stripping + `helmet` security headers + strict `CORS`.
- [x] **Hidden Admin Portal**: Zero `/admin` or login links on the public website; `/admin` and `/api/` disallowed in `/robots.txt` and tagged `noindex, nofollow`.
