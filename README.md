# BoardInG

**Student Accommodation & Boarding Community Platform**  
A solo university Web Application Development project built with **React + Vite + Tailwind CSS**, **Node.js + Express**, and **MongoDB + Mongoose**.

This is a classroom MVP, **not a public property-verification, online payment, or legally binding booking service**. Student/owner identities are self-registered. Accommodation approval is confirmation of **offline arrangements**.

## Included features

- Student and owner registration, login, logout and persisted secure-cookie sessions
- Owner property CRUD (archive instead of destructive delete); publicly searchable listings by city/area and maximum rent
- Accommodation requests: student submits once per house; owner approves/rejects; approval grants a resident membership
- Resident management: owner views confirmed residents and revokes community access
- **Private per-house communities:** resident posts, owner announcements, author-only deletion
- **Maintenance issue tracker:** residents submit issues, owners update progress (`OPEN` → `IN_PROGRESS` → `RESOLVED`)
- CSRF checks on all write APIs, server-side authorization and input validation

Deferred: real-time chat, reviews, payment processing, maps and automatic bed inventory. These are not necessary for the 2–4 week solo MVP.

## Folder structure

```text
BoardInG/
├── client/                       React + Vite frontend
│   └── src/pages/                Houses, Requests, Community, Maintenance
├── server/                       Express backend
│   ├── src/models/               Mongoose models
│   ├── src/routes/               API routes
│   ├── src/middleware/           Shared permissions and CSRF middleware
│   ├── tests/                    Unit tests (no DB required)
│   └── .env.example              Safe configuration template
├── docs/                         Test and audit documentation
├── .gitignore
└── README.md
```

> No `node_modules`, `.git` directory or actual `.env` is included in this ZIP. Your existing Docker MongoDB data volume is separate and will not be changed by extracting these files.

## Requirements

- Windows with PowerShell and VS Code (macOS/Linux also work with equivalent commands)
- Node.js **22+** (prefer a supported LTS release) and npm
- Docker Desktop with Docker engine started, or an externally managed MongoDB instance
- Ports **5000** (API), **5173** (Vite), **27017** (local MongoDB)

## Installation (PowerShell)

### 1. Start MongoDB

If you already created the container during earlier BoardInG work, **keep using it**:

```powershell
docker start boarding-mongo
docker ps
```

If the container does **not** exist yet, create it once:

```powershell
docker run -d --name boarding-mongo --restart unless-stopped -p 127.0.0.1:27017:27017 -v boarding-mongo-data:/data/db mongo:7
```

Check it with:

```powershell
docker exec boarding-mongo mongosh --quiet --eval "db.adminCommand({ ping: 1 })"
```

Expected: `{ ok: 1 }`. This unauthenticated database binding is for **local development only**, not public hosting.

### 2. Install the Express backend

From the newly extracted `BoardInG` folder:

```powershell
cd server
npm ci
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open `server/.env`, set `SESSION_SECRET` to the generated random value, and check `MONGO_URI`. **Do not share or commit `.env`.** If you are replacing an earlier working local project, you may instead copy your existing private `server/.env` into the new `server` folder.

Run:

```powershell
npm run check
npm test
npm run dev
```

Expected log: `MongoDB connected successfully` and `BoardInG API running at http://localhost:5000`.

Open <http://localhost:5000/api/health> — the response should report `database: "connected"`.

### 3. Install and run the React frontend

Open **another terminal** in the newly extracted `BoardInG` folder:

```powershell
cd client
npm ci
npm run dev
```

Open <http://localhost:5173>.

Vite proxies `/api` to `http://localhost:5000` so you don't need to configure CORS for local development.

### 4. Optional: production build check

```powershell
cd client
npm run build
```

If you switch between operating systems, reinstall dependencies on each OS with `npm ci` rather than reusing `node_modules` created on a different OS.

## Quick demonstration

1. Register an **OWNER** account and create a house at `/owner/houses`.
2. Log out. Register a separate **STUDENT** account, browse houses, and request accommodation.
3. Log back in as the owner and approve the request under `/owner/requests` **after offline confirmation**.
4. As student, open `/student/requests`, see `APPROVED` and the community link.
5. Enter the private community, create a post, and submit a maintenance issue.
6. As owner, publish an announcement, view resident issues and change their status.
7. Revoke the student's membership via `/owner/residents`; confirm that the student cannot access the community or issues afterward.

See [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) for a complete checklist and negative tests.

## Important security and implementation notes

- HTTP-only session cookies, a MongoDB-backed session store and CSRF token checking are included. Production requires HTTPS, a suitable reverse proxy, secure cookies and further hardening.
- User roles are checked on the **backend**, not only in the React interface. Owners may only modify their own properties, requests, residents and announcements. Residents may only access their own house communities.
- Repeated requests to the same boarding house are blocked with a compound unique MongoDB index.
- The approval flow makes two MongoDB writes (approved request and membership). The second write is retryable; it is **not atomic** on a standalone MongoDB server. Production should use MongoDB transactions on a replica set and verify consistency.
- Property images use optional HTTPS URLs rather than user uploads; file upload and image moderation are deferred.
- Personal emails are visible to the owner of the relevant requests or memberships, not to random visitors.
- If you included a `SESSION_SECRET` in a shared or publicly distributed archive, rotate it before real-world use. This replacement ZIP does **not** include any original secret.

## GitHub workflow

Create your own repository after extracting and testing, or copy changed `client`, `server` and `docs` into your existing Git project. **Do not overwrite the original `.git` directory** when applying the ZIP to an existing repository.

```powershell
git status
git add client server docs README.md .gitignore
git diff --cached --name-only
git commit -m "feat: complete BoardInG MVP with requests communities and maintenance"
```

Make sure no `.env` or `node_modules` files are staged before committing.
