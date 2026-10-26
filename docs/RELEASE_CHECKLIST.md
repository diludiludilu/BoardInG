# BoardInG — Final Delivery Checklist

## Build and security gates

- [ ] `npm audit fix` run in `server`; `npm ls body-parser` confirms `2.4.0` or newer.
- [ ] `npm audit` and `npm audit --omit=dev` show no remaining high/critical advisories; investigate anything still reported.
- [ ] `npm run check` and `npm test` pass in `server`.
- [ ] `npm run build` passes in `client`.
- [ ] `git diff --check` returns no output.
- [ ] `git status -sb` and `git log -3 --oneline` checked; `git push origin main` succeeds and `git status -sb` shows no ahead commits.
- [ ] No `.env`, real student identities, raw credentials, `.git`, or `node_modules` in the submitted ZIP.
- [ ] Replace any session secret accidentally disclosed in screenshots, chat or archives, restart backend, and re-login.

## Acceptance and negative checks

- [x] Owner register/login/create listing — developer-reported PASS.
- [x] Student browse/search — developer-reported PASS.
- [x] Student submit request — developer-reported PASS.
- [x] Owner approve/reject — developer-reported PASS.
- [x] Approved resident private community access — developer-reported PASS.
- [x] Student community posts — developer-reported PASS.
- [x] Owner announcements — developer-reported PASS.
- [x] Student maintenance issue — developer-reported PASS.
- [x] Owner issue status update — developer-reported PASS.
- [x] Non-resident private-data access blocked — developer-reported PASS.
- [x] Logout and refresh — developer-reported PASS.
- [ ] Verify owner A cannot edit owner B's property or approve owner B's student requests.
- [ ] Verify direct API writes without CSRF token return HTTP 403.
- [ ] Verify revoked resident cannot access posts/issues after refresh, including direct API access.
- [ ] Verify archived/full property cannot receive accommodation requests.
- [ ] Verify two simultaneous approval attempts cannot create duplicate memberships.
- [ ] Verify invalid/oversized JSON returns a safe client error rather than crashing the process.
- [ ] Verify narrow mobile viewport, accessible labels, keyboard navigation, and error states.

## Submission artifacts to prepare

- [ ] GitHub repository URL (correct account), latest commit ID, and README.
- [ ] Clean project ZIP exported from **verified live repo**, excluding dependencies and secrets.
- [ ] Screenshots: homepage, search, owner listing, student request, owner approval, approved resident community, announcement, maintenance ticket.
- [ ] Architecture and database diagram (see `ARCHITECTURE.md`).
- [ ] Unit/build/audit terminal screenshots (avoid exposing session secrets or actual student emails).
- [ ] Demo accounts containing fake names and example data only; no real personal data.
- [ ] Acknowledge limitations: no online payments or real-time chat, offline owner verification, membership approval two-write race on standalone MongoDB.

## Submission note

No single university grading rubric was available in an extractable form. Confirm that your course requirements, citation rules and format match the final submission contents.
