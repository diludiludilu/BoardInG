const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const BoardingHouse = require("../src/models/BoardingHouse");
const AccommodationRequest = require("../src/models/AccommodationRequest");
const Membership = require("../src/models/Membership");
const CommunityPost = require("../src/models/CommunityPost");
const MaintenanceIssue = require("../src/models/MaintenanceIssue");
const { requireCsrf, requireObjectId } = require("../src/middleware/access");
const owner = new mongoose.Types.ObjectId();
const student = new mongoose.Types.ObjectId();
const houseId = new mongoose.Types.ObjectId();

test("boarding model accepts a valid listing", async () => {
  const house = new BoardingHouse({ ownerId: owner, title: "Green View Boarding", description: "A comfortable boarding house near the university", city: "Matara", area: "Wellamadama", monthlyRentLkr: 12000, facilities: ["Wi-Fi", "Kitchen"] });
  await house.validate();
  assert.equal(house.status, "ACTIVE");
  assert.equal(house.availability, "AVAILABLE");
});

test("boarding model rejects bad rent and unsafe image URL", async () => {
  const house = new BoardingHouse({ ownerId: owner, title: "Green View Boarding", description: "A comfortable boarding house near the university", city: "Matara", area: "Wellamadama", monthlyRentLkr: -25, imageUrl: "javascript:alert(1)" });
  await assert.rejects(house.validate(), { name: "ValidationError" });
});

test("request and membership models declare unique student-house constraints", () => {
  for (const Model of [AccommodationRequest, Membership]) {
    assert.ok(Model.schema.indexes().some(([fields, config]) => fields.studentId === 1 && fields.boardingHouseId === 1 && config.unique === true));
  }
});

test("community post type is constrained to POST or ANNOUNCEMENT", async () => {
  const valid = new CommunityPost({ authorId: student, boardingHouseId: houseId, type: "POST", content: "Welcome!" });
  await valid.validate();
  const invalid = new CommunityPost({ authorId: student, boardingHouseId: houseId, type: "ADMIN", content: "fake" });
  await assert.rejects(invalid.validate(), { name: "ValidationError" });
});

test("CSRF middleware rejects missing and invalid tokens", () => {
  const testRequest = (actual, expected) => {
    const req = { get: () => actual, session: { csrfToken: expected } };
    let responseCode;
    const res = { status(code) { responseCode = code; return this; }, json() { return this; } };
    let allowed = false;
    requireCsrf(req, res, () => { allowed = true; });
    return { responseCode, allowed };
  };
  assert.equal(testRequest(null, "secret").responseCode, 403);
  assert.equal(testRequest("bad", "secret").responseCode, 403);
  assert.equal(testRequest("secret", "secret").allowed, true);
});

test("object ID middleware rejects invalid house identifiers", () => {
  const req = { params: { houseId: "not-an-object-id" } };
  const res = { status(code) { this.code = code; return this; }, json() { return this; } };
  let called = false;
  requireObjectId("houseId")(req, res, () => { called = true; });
  assert.equal(res.code, 400);
  assert.equal(called, false);
});


test("maintenance ticket accepts a valid issue and rejects short descriptions", async () => {
  const issue = new MaintenanceIssue({ boardingHouseId: houseId, studentId: student, title: "Broken light", description: "The bedroom light is flickering repeatedly" });
  await issue.validate();
  assert.equal(issue.status, "OPEN");
  issue.description = "short";
  await assert.rejects(issue.validate(), { name: "ValidationError" });
});
