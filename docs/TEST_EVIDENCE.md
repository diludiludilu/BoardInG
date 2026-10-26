# Functional Testing Record

**Product:** BoardInG, student boarding and resident community MVP.
**Evidence source:** Developer's manual report in the ChatGPT conversation on 27 October 2026. Results below were not independently reproduced by the assistant.

| # | Test performed | Reported result |
|---|---|---|
| 1 | Owner registration, login, house creation | PASS |
| 2 | Student browse and search | PASS |
| 3 | Student submits accommodation request | PASS |
| 4 | Owner approves or rejects a request | PASS |
| 5 | Approved student accesses private community | PASS |
| 6 | Student creates community post | PASS |
| 7 | Owner publishes announcement | PASS |
| 8 | Student reports maintenance problem | PASS |
| 9 | Owner updates maintenance problem status | PASS |
| 10 | Non-resident cannot access private community data | PASS |
| 11 | Logout and refresh work | PASS |

**Summary:** 11/11 test cases were reported as passing by the developer.

**Previously observed command outputs (Oct 27, 2026):** 7 backend model/middleware unit tests passed; React/Vite production build completed successfully; MongoDB responded to ping and Express announced a successful database connection. These command outputs precede any new release patch or dependency repair and must be rerun for the final commit.

**Not verified:** Current GitHub HEAD, vulnerability-remediation outcome, production deployment, data persistence under service restart, cross-account negative tests beyond test #10, end-to-end browser automation, accessibility audit, data backup and recovery.

### Screenshots for instructor demonstration

Screenshot only example test data; redact private names/emails and **never include `.env` or session cookies**.

1. Home and browse/search
2. Owner property CRUD
3. Student pending accommodation request
4. Owner approval screen
5. Student approved request and community access
6. Community post and owner announcement
7. Student issue creation and owner resolution
8. Terminal: test results, build, final npm audit, Git commit
