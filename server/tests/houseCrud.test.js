const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");

const User = require("../src/models/User");
const BoardingHouse = require("../src/models/BoardingHouse");
const AccommodationRequest = require("../src/models/AccommodationRequest");
const Membership = require("../src/models/Membership");
const CommunityPost = require("../src/models/CommunityPost");
const MaintenanceIssue = require("../src/models/MaintenanceIssue");
const houseRoutes = require("../src/routes/houseRoutes");

const TEST_DB_URI = "mongodb://127.0.0.1:27017/boarding_disposable_crud_test";
assert.ok(!TEST_DB_URI.includes("boarding_db"), "Safety check: test must never point to boarding_db");

let server;
let baseUrl;
let owner1User;
let owner2User;
let studentUser;

const CSRF_TOKEN = "test-csrf-valid-token-12345";

// Build test express app using houseRoutes and isolated session middleware
const app = express();
app.use(express.json());
app.use(
  session({
    secret: "disposable-test-secret-at-least-32-chars-long",
    resave: false,
    saveUninitialized: false,
  })
);

// Test helper endpoint to establish an authenticated session with CSRF token
app.post("/test/auth-session", (req, res) => {
  req.session.userId = req.body.userId;
  req.session.csrfToken = req.body.csrfToken || CSRF_TOKEN;
  res.json({ ok: true, session: req.session });
});

app.use("/api/houses", houseRoutes);

// Generic error handler mimicking server.js
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(500).json({ message: error.message });
});

// Helper for making HTTP requests with cookie support
async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { ...options.headers };

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }
  if (options.csrf !== false && options.csrf !== null && options.csrf !== undefined) {
    headers["x-csrf-token"] = options.csrf;
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  const setCookie = response.headers.get("set-cookie");
  const cookie = setCookie ? setCookie.split(";")[0] : options.cookie;

  return {
    status: response.status,
    body,
    cookie,
    headers: response.headers,
  };
}

async function loginAs(userId, csrfToken = CSRF_TOKEN) {
  const res = await request("/test/auth-session", {
    method: "POST",
    body: { userId, csrfToken },
  });
  return res.cookie;
}

test.before(async () => {
  await mongoose.connect(TEST_DB_URI);
  await mongoose.connection.dropDatabase();

  // Create test users
  owner1User = await User.create({
    name: "Test Owner One",
    email: "owner1@disposable-test.lk",
    passwordHash: "dummyhash",
    role: "OWNER",
  });

  owner2User = await User.create({
    name: "Test Owner Two",
    email: "owner2@disposable-test.lk",
    passwordHash: "dummyhash",
    role: "OWNER",
  });

  studentUser = await User.create({
    name: "Test Student",
    email: "student@disposable-test.lk",
    passwordHash: "dummyhash",
    role: "STUDENT",
  });

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection?.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

test("EC4307 Rubric: Full CRUD Lifecycle (Create -> Read -> Update -> Delete)", async () => {
  const owner1Cookie = await loginAs(owner1User._id);

  // 1. CREATE: Owner creates a new unreferenced boarding house
  const createRes = await request("/api/houses", {
    method: "POST",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
    body: {
      title: "Temporary Test Boarding House",
      description: "A newly created boarding house with no prior links",
      city: "Moratuwa",
      area: "Katubedda",
      monthlyRentLkr: 22000,
      facilities: ["Wi-Fi", "Study Desk"],
    },
  });

  assert.equal(createRes.status, 201, "Create should return 201 Created");
  assert.equal(createRes.body.title, "Temporary Test Boarding House");
  assert.equal(createRes.body.status, "ACTIVE");
  const createdHouseId = createRes.body._id;

  // 2. READ: Public details and search results contain the created house
  const readRes = await request(`/api/houses/${createdHouseId}`);
  assert.equal(readRes.status, 200, "Read single property should return 200");
  assert.equal(readRes.body._id, createdHouseId);
  assert.equal(readRes.body.monthlyRentLkr, 22000);

  const searchRes = await request("/api/houses?city=Moratuwa");
  assert.equal(searchRes.status, 200);
  assert.ok(
    searchRes.body.some((h) => h._id === createdHouseId),
    "Search results must include the newly created house"
  );

  // 3. UPDATE: Owner modifies the property
  const updateRes = await request(`/api/houses/${createdHouseId}`, {
    method: "PATCH",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
    body: {
      title: "Updated Test Boarding House",
      monthlyRentLkr: 24500,
      description: "Updated description for test house",
    },
  });

  assert.equal(updateRes.status, 200, "Update should return 200 OK");
  assert.equal(updateRes.body.title, "Updated Test Boarding House");
  assert.equal(updateRes.body.monthlyRentLkr, 24500);

  // Verify read reflects the update
  const readUpdatedRes = await request(`/api/houses/${createdHouseId}`);
  assert.equal(readUpdatedRes.body.title, "Updated Test Boarding House");
  assert.equal(readUpdatedRes.body.monthlyRentLkr, 24500);

  // 4. DELETE: Owner permanently deletes the unreferenced house
  const deleteRes = await request(`/api/houses/${createdHouseId}/permanent`, {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
  });

  assert.equal(deleteRes.status, 200, "Permanent delete should return 200 OK");
  assert.equal(deleteRes.body.message, "Boarding house permanently deleted");
  assert.equal(deleteRes.body.deletedId, createdHouseId);

  // 5. VERIFY DELETION PERSISTENCE in MongoDB and Search Results
  const inMongo = await BoardingHouse.findById(createdHouseId);
  assert.equal(inMongo, null, "Deleted property must no longer exist in MongoDB");

  const readDeletedRes = await request(`/api/houses/${createdHouseId}`);
  assert.equal(readDeletedRes.status, 404, "Read on deleted property must return 404 Not Found");

  const searchAfterDelete = await request("/api/houses?city=Moratuwa");
  assert.equal(searchAfterDelete.status, 200);
  assert.ok(
    !searchAfterDelete.body.some((h) => h._id === createdHouseId),
    "Search results must NOT contain the permanently deleted property"
  );
});

test("Browse Houses Sorting: Newest, Rent Low to High, Rent High to Low", async () => {
  // Create 3 active houses with distinct rent values and timestamps
  const baseDate = Date.now();
  const houseA = await BoardingHouse.create({
    ownerId: owner1User._id,
    title: "House A Low Rent",
    description: "Affordable room close to Moratuwa campus",
    city: "Moratuwa",
    area: "Katubedda",
    monthlyRentLkr: 14000,
    status: "ACTIVE",
    createdAt: new Date(baseDate - 30000), // Oldest
  });

  const houseB = await BoardingHouse.create({
    ownerId: owner1User._id,
    title: "House B High Rent",
    description: "Luxury student room with air conditioning",
    city: "Moratuwa",
    area: "Katubedda",
    monthlyRentLkr: 45000,
    status: "ACTIVE",
    createdAt: new Date(baseDate - 20000), // Middle
  });

  const houseC = await BoardingHouse.create({
    ownerId: owner1User._id,
    title: "House C Mid Rent",
    description: "Modern single room in student residential area",
    city: "Moratuwa",
    area: "Katubedda",
    monthlyRentLkr: 28000,
    status: "ACTIVE",
    createdAt: new Date(baseDate - 10000), // Newest
  });

  // Sort: Newest (default or ?sort=newest)
  const defaultSortRes = await request("/api/houses?city=Moratuwa");
  assert.equal(defaultSortRes.status, 200);
  const defaultIds = defaultSortRes.body.map((h) => h._id);
  assert.deepEqual(defaultIds, [String(houseC._id), String(houseB._id), String(houseA._id)]);

  const explicitNewestRes = await request("/api/houses?city=Moratuwa&sort=newest");
  assert.equal(explicitNewestRes.status, 200);
  const explicitNewestIds = explicitNewestRes.body.map((h) => h._id);
  assert.deepEqual(explicitNewestIds, [String(houseC._id), String(houseB._id), String(houseA._id)]);

  // Sort: Rent Low to High (?sort=rent_asc)
  const rentAscRes = await request("/api/houses?city=Moratuwa&sort=rent_asc");
  assert.equal(rentAscRes.status, 200);
  const rentAscRents = rentAscRes.body.map((h) => h.monthlyRentLkr);
  assert.deepEqual(rentAscRents, [14000, 28000, 45000]);

  // Sort: Rent High to Low (?sort=rent_desc)
  const rentDescRes = await request("/api/houses?city=Moratuwa&sort=rent_desc");
  assert.equal(rentDescRes.status, 200);
  const rentDescRents = rentDescRes.body.map((h) => h.monthlyRentLkr);
  assert.deepEqual(rentDescRents, [45000, 28000, 14000]);

  // Invalid sort option rejected with 400
  const invalidSortRes = await request("/api/houses?sort=unsupported_sort");
  assert.equal(invalidSortRes.status, 400);
  assert.equal(invalidSortRes.body.message, "Invalid sort option");

  // Clean up test houses
  await BoardingHouse.deleteMany({ _id: { $in: [houseA._id, houseB._id, houseC._id] } });
});

test("Security & Authorization: Reject unauthorized, foreign-owner, and invalid requests", async () => {
  const targetHouse = await BoardingHouse.create({
    ownerId: owner1User._id,
    title: "Security Test House",
    description: "House for testing access control on permanent delete",
    city: "Colombo",
    area: "Kollupitiya",
    monthlyRentLkr: 30000,
    status: "ACTIVE",
  });

  const owner1Cookie = await loginAs(owner1User._id);
  const owner2Cookie = await loginAs(owner2User._id);
  const studentCookie = await loginAs(studentUser._id);

  // 1. Unauthenticated request (no cookie) -> 401
  const unauthRes = await request(`/api/houses/${targetHouse._id}/permanent`, {
    method: "DELETE",
    csrf: CSRF_TOKEN,
  });
  assert.equal(unauthRes.status, 401, "Unauthenticated delete must be rejected with 401");

  // 2. Student role -> 403
  const studentRes = await request(`/api/houses/${targetHouse._id}/permanent`, {
    method: "DELETE",
    cookie: studentCookie,
    csrf: CSRF_TOKEN,
  });
  assert.equal(studentRes.status, 403, "Student delete must be rejected with 403");

  // 3. Foreign owner (Owner 2 trying to delete Owner 1's house) -> 403
  const foreignRes = await request(`/api/houses/${targetHouse._id}/permanent`, {
    method: "DELETE",
    cookie: owner2Cookie,
    csrf: CSRF_TOKEN,
  });
  assert.equal(foreignRes.status, 403, "Foreign owner delete must be rejected with 403");
  assert.match(foreignRes.body.message, /only delete your own/i);

  // 4. Invalid ObjectId parameter -> 400
  const invalidIdRes = await request("/api/houses/not-a-valid-object-id/permanent", {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
  });
  assert.equal(invalidIdRes.status, 400, "Invalid ObjectId must be rejected with 400");

  // 5. Missing CSRF token -> 403
  const missingCsrfRes = await request(`/api/houses/${targetHouse._id}/permanent`, {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: null,
  });
  assert.equal(missingCsrfRes.status, 403, "Missing CSRF token must be rejected with 403");

  // 6. Invalid CSRF token -> 403
  const badCsrfRes = await request(`/api/houses/${targetHouse._id}/permanent`, {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: "wrong-csrf-token",
  });
  assert.equal(badCsrfRes.status, 403, "Invalid CSRF token must be rejected with 403");

  // Cleanup
  await BoardingHouse.deleteOne({ _id: targetHouse._id });
});

test("Linked-Record Protection: Reject property linked to requests, memberships, posts, or issues", async () => {
  const house = await BoardingHouse.create({
    ownerId: owner1User._id,
    title: "Linked Records Test House",
    description: "Testing linked-record deletion protection",
    city: "Moratuwa",
    area: "Katubedda",
    monthlyRentLkr: 20000,
    status: "ACTIVE",
  });

  const owner1Cookie = await loginAs(owner1User._id);

  // Case A: Linked to AccommodationRequest
  const reqDoc = await AccommodationRequest.create({
    studentId: studentUser._id,
    boardingHouseId: house._id,
    message: "I want to book",
    status: "PENDING",
  });

  const deleteReqRes = await request(`/api/houses/${house._id}/permanent`, {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
  });
  assert.equal(deleteReqRes.status, 409, "Must reject property linked to accommodation request");
  assert.match(deleteReqRes.body.message, /accommodation request/i);
  await AccommodationRequest.deleteOne({ _id: reqDoc._id });

  // Case B: Linked to Membership
  const memberDoc = await Membership.create({
    studentId: studentUser._id,
    boardingHouseId: house._id,
    status: "ACTIVE",
  });

  const deleteMemberRes = await request(`/api/houses/${house._id}/permanent`, {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
  });
  assert.equal(deleteMemberRes.status, 409, "Must reject property linked to membership");
  assert.match(deleteMemberRes.body.message, /membership/i);
  await Membership.deleteOne({ _id: memberDoc._id });

  // Case C: Linked to CommunityPost
  const postDoc = await CommunityPost.create({
    authorId: studentUser._id,
    boardingHouseId: house._id,
    type: "POST",
    content: "Hi community!",
  });

  const deletePostRes = await request(`/api/houses/${house._id}/permanent`, {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
  });
  assert.equal(deletePostRes.status, 409, "Must reject property linked to community post");
  assert.match(deletePostRes.body.message, /community post/i);
  await CommunityPost.deleteOne({ _id: postDoc._id });

  // Case D: Linked to MaintenanceIssue
  const issueDoc = await MaintenanceIssue.create({
    studentId: studentUser._id,
    boardingHouseId: house._id,
    title: "Leaking faucet",
    description: "The bathroom faucet is dripping continuously",
    status: "OPEN",
  });

  const deleteIssueRes = await request(`/api/houses/${house._id}/permanent`, {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
  });
  assert.equal(deleteIssueRes.status, 409, "Must reject property linked to maintenance issue");
  assert.match(deleteIssueRes.body.message, /maintenance issue/i);
  await MaintenanceIssue.deleteOne({ _id: issueDoc._id });

  // Case E: Once all linked records are removed, permanent delete succeeds
  const cleanDeleteRes = await request(`/api/houses/${house._id}/permanent`, {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
  });
  assert.equal(cleanDeleteRes.status, 200, "Should succeed once no linked records remain");
  const inDb = await BoardingHouse.findById(house._id);
  assert.equal(inDb, null, "Must be removed from database");
});

test("Seed-Manifest Protection: Demonstration houses in _seed_manifest cannot be permanently deleted", async () => {
  const demoHouse = await BoardingHouse.create({
    ownerId: owner1User._id,
    title: "Seeded Protected House",
    description: "A demonstration house registered in _seed_manifest",
    city: "Colombo",
    area: "Dalugama",
    monthlyRentLkr: 20000,
    status: "ACTIVE",
  });

  // Register in _seed_manifest in the disposable database
  await mongoose.connection.collection("_seed_manifest").insertOne({
    manifestVersion: "1.0.0",
    fixtureVersion: "phase-c1-sri-lanka-87",
    state: "COMPLETED",
    insertedIds: {
      boardinghouses: [demoHouse._id],
    },
  });

  const owner1Cookie = await loginAs(owner1User._id);

  // Attempt permanent delete even though it has zero linked records
  const deleteRes = await request(`/api/houses/${demoHouse._id}/permanent`, {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
  });

  assert.equal(deleteRes.status, 403, "Demonstration house must be protected with 403 Forbidden");
  assert.match(deleteRes.body.message, /demonstration boarding houses cannot be permanently deleted/i);

  // Verify document was NOT deleted
  const stillInDb = await BoardingHouse.findById(demoHouse._id);
  assert.ok(stillInDb, "Demonstration property must remain untouched in MongoDB");

  // Cleanup disposable test records
  await BoardingHouse.deleteOne({ _id: demoHouse._id });
  await mongoose.connection.collection("_seed_manifest").deleteMany({});
});

test("Backward Compatibility: Existing Archive functionality preserved on DELETE /api/houses/:id", async () => {
  const house = await BoardingHouse.create({
    ownerId: owner1User._id,
    title: "Archive Compatibility Test House",
    description: "Testing that DELETE without permanent param continues to archive",
    city: "Moratuwa",
    area: "Katubedda",
    monthlyRentLkr: 21000,
    status: "ACTIVE",
  });

  const owner1Cookie = await loginAs(owner1User._id);

  // Standard DELETE /api/houses/:id (without permanent)
  const archiveRes = await request(`/api/houses/${house._id}`, {
    method: "DELETE",
    cookie: owner1Cookie,
    csrf: CSRF_TOKEN,
  });

  assert.equal(archiveRes.status, 200, "Archive should return 200 OK");
  assert.equal(archiveRes.body.message, "Boarding house archived");

  // Verify document STILL EXISTS in MongoDB, but status is now ARCHIVED
  const archivedDoc = await BoardingHouse.findById(house._id);
  assert.ok(archivedDoc, "Archived document must still exist in MongoDB");
  assert.equal(archivedDoc.status, "ARCHIVED");

  // Verify it is excluded from active public searches
  const searchRes = await request("/api/houses?city=Moratuwa");
  assert.ok(
    !searchRes.body.some((h) => h._id === String(house._id)),
    "Archived house must not appear in active public search results"
  );

  // Cleanup
  await BoardingHouse.deleteOne({ _id: house._id });
});
