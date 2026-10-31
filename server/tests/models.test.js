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
  const house = new BoardingHouse({ ownerId: owner, title: "Katubedda Scholar Haven", description: "A comfortable boarding house near University of Moratuwa", city: "Moratuwa", area: "Katubedda", monthlyRentLkr: 16500, facilities: ["Wi-Fi", "Kitchen"] });
  await house.validate();
  assert.equal(house.status, "ACTIVE");
  assert.equal(house.availability, "AVAILABLE");
});

test("boarding model rejects bad rent and unsafe image URL", async () => {
  const house = new BoardingHouse({ ownerId: owner, title: "Katubedda Scholar Haven", description: "A comfortable boarding house near University of Moratuwa", city: "Moratuwa", area: "Katubedda", monthlyRentLkr: -25, imageUrl: "javascript:alert(1)" });
  await assert.rejects(house.validate(), { name: "ValidationError" });
});

test("boarding model supports multi-photo gallery and bidirectional synchronization", async () => {
  // Test 1: Setting imageUrls syncs imageUrl to imageUrls[0]
  const houseWithList = new BoardingHouse({
    ownerId: owner,
    title: "Katubedda Scholar Haven",
    description: "A comfortable boarding house near University of Moratuwa",
    city: "Moratuwa",
    area: "Katubedda",
    monthlyRentLkr: 16500,
    imageUrls: [
      "/demo/houses/house-01-exterior.png",
      "/demo/houses/house-01-bedroom.png",
      "https://example.com/shared.jpg",
    ],
  });
  await houseWithList.validate();
  assert.equal(houseWithList.imageUrl, "/demo/houses/house-01-exterior.png");
  assert.equal(houseWithList.imageUrls.length, 3);

  // Test 2: Setting legacy single imageUrl syncs imageUrls to [imageUrl]
  const houseWithSingle = new BoardingHouse({
    ownerId: owner,
    title: "Mount Lavinia Student Annex",
    description: "A comfortable seaside student annex close to Moratuwa campus",
    city: "Dehiwala",
    area: "Mount Lavinia",
    monthlyRentLkr: 22000,
    imageUrl: "https://example.com/single.jpg",
  });
  await houseWithSingle.validate();
  assert.deepEqual(houseWithSingle.imageUrls, ["https://example.com/single.jpg"]);

  // Test 3: Reject exceeding 5 images
  const houseExceedingMax = new BoardingHouse({
    ownerId: owner,
    title: "Excess Photos Boarding",
    description: "A comfortable boarding house listing with too many photos",
    city: "Moratuwa",
    area: "Katubedda",
    monthlyRentLkr: 16500,
    imageUrls: [
      "/demo/houses/1.jpg",
      "/demo/houses/2.jpg",
      "/demo/houses/3.jpg",
      "/demo/houses/4.jpg",
      "/demo/houses/5.jpg",
      "/demo/houses/6.jpg",
    ],
  });
  await assert.rejects(houseExceedingMax.validate(), { name: "ValidationError" });

  // Test 4: Reject unsafe URLs in imageUrls (insecure HTTP, path traversal, encoded traversal, arbitrary local root paths, invalid extensions, protocol-relative)
  const unsafeCases = [
    ["/demo/houses/safe.jpg", "http://insecure.com/bad.jpg"],
    ["/demo/houses/safe.jpg", "/demo/houses/../../etc/passwd"],
    ["/demo/houses/safe.jpg", "/demo/houses/%2e%2e/passwd.jpg"],
    ["/demo/houses/safe.jpg", "/demo/houses/%2E%2E/passwd.jpg"],
    ["/demo/houses/safe.jpg", "/uploads/avatar.jpg"],
    ["/demo/houses/safe.jpg", "/demo/other/room.jpg"],
    ["/demo/houses/safe.jpg", "/demo/houses/malicious.exe"],
    ["/demo/houses/safe.jpg", "/demo/houses/script.js"],
    ["/demo/houses/safe.jpg", "/demo/houses/markup.html"],
    ["/demo/houses/safe.jpg", "//evil.com/pic.jpg"],
    ["/demo/houses/safe.jpg", "javascript:alert(1)"],
    ["/demo/houses/safe.jpg", "data:image/png;base64,abc"],
    ["/demo/houses/safe.jpg", "file:///etc/passwd"],
  ];
  for (const urls of unsafeCases) {
    const invalidHouse = new BoardingHouse({
      ownerId: owner,
      title: "Unsafe Photos Boarding",
      description: "A comfortable boarding house listing with unsafe photos",
      city: "Moratuwa",
      area: "Katubedda",
      monthlyRentLkr: 16500,
      imageUrls: urls,
    });
    await assert.rejects(invalidHouse.validate(), { name: "ValidationError" }, `Should reject ${JSON.stringify(urls)}`);
  }
});

test("update synchronization hook prevents stale cover images and handles image clearing", () => {
  // Find our registered findOneAndUpdate hook for image synchronization
  const hooks = BoardingHouse.schema.s.hooks._pres.get("findOneAndUpdate") || [];
  const syncHook = hooks.find((h) => h.fn.toString().includes("imageUrls"));
  assert.ok(syncHook, "imageUrls synchronization hook must be registered on findOneAndUpdate");

  const runHook = (setObj) => {
    const query = {
      getUpdate() {
        return { $set: setObj };
      },
    };
    syncHook.fn.call(query);
    return setObj;
  };

  // Case 1: Reordering images updates cover image (no stale cover)
  const reorderUpdate = runHook({
    imageUrls: ["/demo/houses/new-cover.jpg", "/demo/houses/old-cover.jpg"],
  });
  assert.equal(reorderUpdate.imageUrl, "/demo/houses/new-cover.jpg");

  // Case 2: Clearing gallery clears cover image
  const clearUpdate = runHook({
    imageUrls: [],
  });
  assert.equal(clearUpdate.imageUrl, "");
  assert.deepEqual(clearUpdate.imageUrls, []);

  // Case 3: Legacy single imageUrl update populates imageUrls
  const legacyUpdate = runHook({
    imageUrl: "https://example.com/legacy-photo.jpg",
  });
  assert.deepEqual(legacyUpdate.imageUrls, ["https://example.com/legacy-photo.jpg"]);
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
