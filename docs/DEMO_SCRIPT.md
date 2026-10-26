# BoardInG — 5-Minute Demo and Viva Preparation

## Before presenting

- Start Docker Desktop, the `boarding-mongo` container, Express and Vite.
- Use two fake accounts, one OWNER and one STUDENT. Prepare a test property and an offline-approved student in the database.
- Keep a second browser or private window ready, because student and owner sessions must be distinct.
- Keep copies of screenshots as a fallback if the live demo has connectivity problems.

## Demo flow (approximately 5 minutes)

**0:00–0:40 — Problem and solution.** “Students often struggle to find suitable boarding places and communicate with their landlord and roommates. BoardInG brings the discovery and resident community into one platform.” Show homepage and listings.

**0:40–1:30 — Owner creates a property.** Show role-based dashboard, create/edit house, monthly rent, location and availability.

**1:30–2:20 — Student requests accommodation.** Switch to the student account, search by city and budget, open the property and submit a request. Explain that there is no payment or automatic room reservation.

**2:20–3:00 — Owner approves a resident.** Owner reviews and approves after offline agreement. Show how approval creates an active membership.

**3:00–4:10 — Private boarding community.** Student enters the community, publishes a post and reports an issue; owner posts an announcement and changes maintenance status.

**4:10–5:00 — Security and architecture.** Explain React + Vite frontend, Express API, MongoDB database, HTTP-only session cookies, CSRF tokens and authorization checked server-side. Show that non-residents cannot read posts.

## Likely viva questions

- **Why MERN?** A JavaScript-based full-stack with React UI, Express API and MongoDB document models; quick to develop and demonstrate as a solo project.
- **How is login handled?** Passwords are bcrypt-hashed; Express creates a server-side session held in MongoDB; browser receives an HTTP-only session cookie.
- **How do you prevent community data leaks?** Every private API request verifies the user's session, role, and active membership or property ownership on the server.
- **What is CSRF?** A forged cross-site state-changing request; authenticated write endpoints require a session-linked token.
- **Why two collections for requests and memberships?** Request tracks approval history; membership defines current permission to access the community.
- **How does rejection differ from revocation?** Rejection denies an incoming request; revocation removes an existing resident's community access.
- **What would you improve?** Multi-document transactions, more integration tests, identity verification, production hosting and backups.

## Instructor-ready summary

BoardInG is a MERN application with STUDENT/OWNER roles, searchable listings, accommodation requests, approved memberships, access-controlled resident communities, owner announcements, and maintenance issue tracking. Payments and real-time messaging are intentionally excluded from the initial MVP.
