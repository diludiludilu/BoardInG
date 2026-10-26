# BoardInG – manual acceptance tests

Run the backend and frontend (see README) and use **two separate test accounts**.

## Main end-to-end path

- [ ] Register one OWNER and one STUDENT, then log out and log in again.
- [ ] Owner creates a house (e.g. Green View Student Boarding, Matara, rent 12000).
- [ ] New listing appears in public browse and details pages.
- [ ] Search for `Matara` with maximum rent `15000` (included), then `10000` (excluded).
- [ ] Owner updates listing, refreshes the page, and sees persisted data.
- [ ] Student requests the available house and sees PENDING in their dashboard.
- [ ] Owner sees only the requests for their own houses; approves the student.
- [ ] Student sees APPROVED and an ACTIVE membership; opens the private community.
- [ ] Student posts text; owner publishes a differently labelled announcement.
- [ ] Student creates maintenance issue; owner changes status and student sees updated status.
- [ ] Owner revokes membership; student can no longer fetch posts or issues for that house.

## Negative/security checks

- [ ] A visitor cannot post to a private community or request accommodation without login.
- [ ] A nonresident signed-in student cannot fetch another house's posts or maintenance issues (HTTP 403).
- [ ] A STUDENT cannot POST/PATCH/DELETE `/api/houses` listings (HTTP 403).
- [ ] One OWNER cannot edit or archive another owner's listing or approve that owner's request.
- [ ] A resident cannot create an ANNOUNCEMENT by specifying a fake `type` in a request body; backend forces `POST`.
- [ ] Student cannot delete someone else's community post (HTTP 403).
- [ ] Duplicate accommodation request for the same house is rejected (HTTP 409).
- [ ] A `FULL` or `ARCHIVED` boarding house cannot receive new accommodation requests.
- [ ] After membership revocation, old request approval cannot grant membership again.
- [ ] POST/PATCH/DELETE without a correct CSRF token is rejected (HTTP 403).
- [ ] Invalid IDs, negative rent and invalid post content return a 400-level error.
- [ ] Refreshing the browser does not log a valid session out; logout revokes session.

## API routes

| Route | Permissions |
|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | Public, CSRF protected |
| `GET /api/auth/me`, `POST /api/auth/logout` | Session state / CSRF on logout |
| `GET /api/houses`, `GET /api/houses/:id` | Public (active only) |
| `GET /api/houses/mine`, `POST /api/houses`, `PATCH /api/houses/:id`, `DELETE /api/houses/:id` | Owner, own houses |
| `POST /api/houses/:houseId/requests`, `GET /api/requests/mine` | Student |
| `GET /api/owner/requests`, `POST /api/requests/:id/approve`, `POST /api/requests/:id/reject` | Owner of requested house |
| `GET /api/memberships/mine` | Student |
| `GET /api/houses/:houseId/members`, `DELETE /api/houses/:houseId/members/:studentId` | Owner of house |
| `GET /api/houses/:houseId/posts`, `POST /api/houses/:houseId/posts` | Owner or active resident |
| `DELETE /api/posts/:postId` | Post author with current community access |
| `GET /api/houses/:houseId/issues` | Owner (all issues) / resident (own issues) |
| `POST /api/houses/:houseId/issues` | Active resident |
| `PATCH /api/issues/:id` | Owner of house |

Note: All mutation endpoints also require a session CSRF token.
