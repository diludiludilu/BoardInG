const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const mongoose = require("mongoose");

const {
  runSeeder,
  validateFixtures,
  verifyBackupFile,
  verifyDatabaseTarget,
  computeFixtureChecksum,
  getObjectId,
  getDemoPassword,
  ownersData,
  studentsData,
  housesData,
  requestsData,
  membershipsData,
  communityPostsData,
  maintenanceIssuesData,
  EXPECTED_BACKUP_PATH,
  EXPECTED_BACKUP_SHA256,
} = require("../scripts/seedDemoData");

// Temporary test backup file for isolated unit test verification
const TEST_BACKUP_PATH = path.join(__dirname, "temp_test_backup.gz");
const testBackupContent = Buffer.from("BOARDING_TEST_BACKUP_GZ_MOCK_DATA");
fs.writeFileSync(TEST_BACKUP_PATH, testBackupContent);
const TEST_BACKUP_SHA256 = crypto
  .createHash("sha256")
  .update(testBackupContent)
  .digest("hex")
  .toUpperCase();

test.after(() => {
  try {
    if (fs.existsSync(TEST_BACKUP_PATH)) {
      fs.unlinkSync(TEST_BACKUP_PATH);
    }
  } catch (_) {}
});

// Helper to create an in-memory mock MongoDB database
function createMockDatabase(initialCollections = {}) {
  const store = new Map();
  const colInstances = new Map();

  const getCol = (name) => {
    if (!store.has(name)) {
      store.set(name, []);
    }
    return store.get(name);
  };

  for (const [name, docs] of Object.entries(initialCollections)) {
    store.set(name, docs.map((d) => ({ ...d })));
  }

  return {
    _store: store,
    listCollections() {
      return {
        toArray: async () => Array.from(store.keys()).map((name) => ({ name })),
      };
    },
    collection(name) {
      if (colInstances.has(name)) {
        return colInstances.get(name);
      }
      const instance = {
        find(query = {}) {
          return {
            toArray: async () => {
              const list = getCol(name);
              return list.filter((item) => {
                if (query.email && query.email.$in) {
                  return query.email.$in.includes(item.email);
                }
                if (query.title && query.title.$in) {
                  return query.title.$in.includes(item.title);
                }
                if (query._id && query._id.$in) {
                  const idStrings = query._id.$in.map((id) => String(id));
                  return idStrings.includes(String(item._id));
                }
                return true;
              });
            },
          };
        },
        async findOne(query = {}) {
          const list = getCol(name);
          if (list.length === 0) return null;
          return { ...list[0] };
        },
        async countDocuments(query = {}) {
          const list = getCol(name);
          if (query._id && query._id.$in) {
            const idStrings = query._id.$in.map((id) => String(id));
            return list.filter((item) => idStrings.includes(String(item._id))).length;
          }
          return list.length;
        },
        async insertOne(doc) {
          const list = getCol(name);
          const inserted = { ...doc, _id: doc._id || new mongoose.Types.ObjectId() };
          list.push(inserted);
          return { insertedId: inserted._id };
        },
        async insertMany(docs) {
          const list = getCol(name);
          for (const d of docs) {
            list.push({ ...d });
          }
          return { insertedCount: docs.length };
        },
        async updateOne(filter, update) {
          const list = getCol(name);
          const item = list.find((i) => String(i._id) === String(filter._id));
          if (item && update.$set) {
            Object.assign(item, update.$set);
          }
          return { modifiedCount: item ? 1 : 0 };
        },
      };
      colInstances.set(name, instance);
      return instance;
    },
  };
}

const mockBaseline = {
  users: [
    { _id: new mongoose.Types.ObjectId(), name: "Existing Owner", email: "existing.owner@real.lk", role: "OWNER" },
    { _id: new mongoose.Types.ObjectId(), name: "Existing Student 1", email: "existing.stu1@real.lk", role: "STUDENT" },
    { _id: new mongoose.Types.ObjectId(), name: "Existing Student 2", email: "existing.stu2@real.lk", role: "STUDENT" },
    { _id: new mongoose.Types.ObjectId(), name: "Existing Student 3", email: "existing.stu3@real.lk", role: "STUDENT" },
  ],
  boardinghouses: [
    { _id: new mongoose.Types.ObjectId(), title: "Existing Original House", city: "Matara" },
  ],
  accommodationrequests: [
    { _id: new mongoose.Types.ObjectId(), status: "APPROVED" },
    { _id: new mongoose.Types.ObjectId(), status: "PENDING" },
  ],
  memberships: [
    { _id: new mongoose.Types.ObjectId(), status: "ACTIVE" },
    { _id: new mongoose.Types.ObjectId(), status: "ACTIVE" },
  ],
  communityposts: [
    { _id: new mongoose.Types.ObjectId(), type: "ANNOUNCEMENT" },
    { _id: new mongoose.Types.ObjectId(), type: "POST" },
  ],
  maintenanceissues: [
    { _id: new mongoose.Types.ObjectId(), status: "OPEN" },
  ],
  sessions: [
    { _id: new mongoose.Types.ObjectId(), session: "token-1" },
    { _id: new mongoose.Types.ObjectId(), session: "token-2" },
  ],
};

const silentLogger = {
  log() {},
  error() {},
  warn() {},
};

test("seeder dry-run executes zero writes on mock database", async () => {
  const mockDb = createMockDatabase(mockBaseline);
  const mockConnection = { host: "127.0.0.1", port: 27017, name: "boarding_db", db: mockDb };

  const res = await runSeeder({
    isApply: false,
    backupPath: TEST_BACKUP_PATH,
    expectedBackupSha: TEST_BACKUP_SHA256,
    connection: mockConnection,
    dbOverride: mockDb,
    skipAssetCheck: true,
    logger: silentLogger,
  });

  assert.equal(res.status, "DRY_RUN_SUCCESS");
  assert.equal(res.writes, 0);
  assert.equal(res.totalPlanned, 87);

  // Assert all collection counts in mockDb remained strictly untouched
  assert.equal(mockDb._store.get("users").length, 4);
  assert.equal(mockDb._store.get("boardinghouses").length, 1);
  assert.equal(mockDb._store.get("accommodationrequests").length, 2);
  assert.equal(mockDb._store.get("memberships").length, 2);
  assert.equal(mockDb._store.get("communityposts").length, 2);
  assert.equal(mockDb._store.get("maintenanceissues").length, 1);
  assert.equal(mockDb._store.has("_seed_manifest"), false);
});

test("apply without confirmation argument is rejected", async () => {
  await assert.rejects(
    runSeeder({
      isApply: true,
      confirmArg: false,
      envConfirm: "yes",
      demoPassword: "secretPassword123",
      backupPath: TEST_BACKUP_PATH,
      expectedBackupSha: TEST_BACKUP_SHA256,
      logger: silentLogger,
    }),
    /Missing explicit confirmation argument '--confirm-apply'/
  );
});

test("apply without separate environment confirmation flag is rejected", async () => {
  await assert.rejects(
    runSeeder({
      isApply: true,
      confirmArg: true,
      envConfirm: "no",
      demoPassword: "secretPassword123",
      backupPath: TEST_BACKUP_PATH,
      expectedBackupSha: TEST_BACKUP_SHA256,
      logger: silentLogger,
    }),
    /Missing separate environment confirmation flag CONFIRM_DEMO_SEED=yes/
  );
});

test("apply without DEMO_PASSWORD is rejected", async () => {
  await assert.rejects(
    runSeeder({
      isApply: true,
      confirmArg: true,
      envConfirm: "yes",
      demoPassword: "",
      backupPath: TEST_BACKUP_PATH,
      expectedBackupSha: TEST_BACKUP_SHA256,
      logger: silentLogger,
    }),
    /DEMO_PASSWORD environment variable must be provided/
  );
});

test("apply with unexpected database name is rejected", () => {
  assert.throws(
    () => verifyDatabaseTarget({ host: "127.0.0.1", name: "wrong_production_db" }),
    /target must be local boarding_db/
  );
});

test("apply targeting non-local database is rejected", () => {
  assert.throws(
    () => verifyDatabaseTarget({ host: "remote.cloud.atlas.mongodb.net", name: "boarding_db" }),
    /target must be local boarding_db/
  );
});

test("missing backup file is rejected", () => {
  assert.throws(
    () =>
      verifyBackupFile(
        path.join(__dirname, "nonexistent_backup.gz"),
        TEST_BACKUP_SHA256
      ),
    /Backup file not found at expected path/
  );
});

test("incorrect backup checksum is rejected", () => {
  assert.throws(
    () =>
      verifyBackupFile(
        TEST_BACKUP_PATH,
        "0000000000000000000000000000000000000000000000000000000000000000"
      ),
    /Backup SHA-256 mismatch/
  );
});

test("exact original fixture identities are preserved", () => {
  assert.equal(ownersData.length, 4);
  assert.deepEqual(
    ownersData.map((o) => ({ name: o.name, email: o.email })),
    [
      { name: "Sunil Shantha Perera", email: "sunil.perera@example.com" },
      { name: "Sivasubramaniam Tharmalingam", email: "tharmalingam.s@example.com" },
      { name: "Gamini Bandara Jayawardena", email: "gamini.bandara@example.com" },
      { name: "Chandrika Wijesinghe", email: "chandrika.w@example.com" },
    ]
  );

  assert.equal(housesData.length, 8);
  assert.deepEqual(
    housesData.map((h) => h.title),
    [
      "Katubedda Scholar Haven",
      "Mount Lavinia Student Annex",
      "Thirunelvely Green Residence",
      "Kokuvil Student Villa",
      "Hindagala Hillside Lodge",
      "Mahakanda Pine View Rooms",
      "Wijerama Campus Lodge",
      "Dalugama Scholars Retreat",
    ]
  );

  assert.equal(studentsData.length, 12);
  assert.deepEqual(
    studentsData.map((s) => ({ name: s.name, email: s.email })),
    [
      { name: "Kasun Bandara", email: "kasun.bandara@example.com" },
      { name: "Chamari Fernando", email: "chamari.fernando@example.com" },
      { name: "Dinesh Jayakody", email: "dinesh.j@example.com" },
      { name: "Sivaranjani Ketheeswaran", email: "sivaranjani.k@example.com" },
      { name: "Tharindu Wickramasinghe", email: "tharindu.w@example.com" },
      { name: "Anusha Rajapaksha", email: "anusha.r@example.com" },
      { name: "Malith Gunawardena", email: "malith.g@example.com" },
      { name: "Sanduni Senanayake", email: "sanduni.s@example.com" },
      { name: "Praveen Jayasuriya", email: "praveen.j@example.com" },
      { name: "Rashmi Dilrukshi", email: "rashmi.d@example.com" },
      { name: "Vithushan Sivakumar", email: "vithushan.s@example.com" },
      { name: "Kavindi Madushani", email: "kavindi.m@example.com" },
    ]
  );

  assert.equal(requestsData.length, 17);
  assert.equal(membershipsData.length, 11);
  assert.equal(communityPostsData.length, 22);
  assert.equal(maintenanceIssuesData.length, 13);
});

test("collisions involving deterministic IDs in all target collections are rejected", async () => {
  const collectionsToTest = [
    { name: "users", id: getObjectId("owner-1") },
    { name: "boardinghouses", id: getObjectId("house-1") },
    { name: "accommodationrequests", id: getObjectId("req:student-01:house-1") },
    { name: "memberships", id: getObjectId("mem:student-01:house-1") },
    { name: "communityposts", id: getObjectId("post:1:house-1:owner-1") },
    { name: "maintenanceissues", id: getObjectId("issue:1:house-1:student-01") },
  ];

  for (const item of collectionsToTest) {
    const collisionBaseline = {
      ...mockBaseline,
      [item.name]: [
        ...(mockBaseline[item.name] || []),
        { _id: item.id, title: "Pre-existing colliding doc", email: "non-colliding@real.lk" },
      ],
    };
    const mockDb = createMockDatabase(collisionBaseline);
    const mockConnection = { host: "127.0.0.1", port: 27017, name: "boarding_db", db: mockDb };

    await assert.rejects(
      runSeeder({
        isApply: false,
        backupPath: TEST_BACKUP_PATH,
        expectedBackupSha: TEST_BACKUP_SHA256,
        connection: mockConnection,
        dbOverride: mockDb,
        skipAssetCheck: true,
        skipBaselineCheck: true,
        logger: silentLogger,
      }),
      new RegExp(`\\[COLLISION ERROR\\]: Found 1 colliding deterministic ObjectId\\(s\\) in collection "${item.name}"`)
    );
  }
});

test("existing demo-email collision is rejected", async () => {
  const collisionBaseline = {
    ...mockBaseline,
    users: [
      ...mockBaseline.users,
      { _id: new mongoose.Types.ObjectId(), name: "Conflicting Sunil", email: "sunil.perera@example.com", role: "OWNER" },
    ],
  };
  const mockDb = createMockDatabase(collisionBaseline);
  const mockConnection = { host: "127.0.0.1", port: 27017, name: "boarding_db", db: mockDb };

  await assert.rejects(
    runSeeder({
      isApply: false,
      backupPath: TEST_BACKUP_PATH,
      expectedBackupSha: TEST_BACKUP_SHA256,
      connection: mockConnection,
      dbOverride: mockDb,
      skipAssetCheck: true,
      skipBaselineCheck: true,
      logger: silentLogger,
    }),
    /COLLISION ERROR.*conflicting user email/
  );
});

test("existing house title collision is rejected", async () => {
  const collisionBaseline = {
    ...mockBaseline,
    boardinghouses: [
      ...mockBaseline.boardinghouses,
      { _id: new mongoose.Types.ObjectId(), title: "Katubedda Scholar Haven", city: "Moratuwa" },
    ],
  };
  const mockDb = createMockDatabase(collisionBaseline);
  const mockConnection = { host: "127.0.0.1", port: 27017, name: "boarding_db", db: mockDb };

  await assert.rejects(
    runSeeder({
      isApply: false,
      backupPath: TEST_BACKUP_PATH,
      expectedBackupSha: TEST_BACKUP_SHA256,
      connection: mockConnection,
      dbOverride: mockDb,
      skipAssetCheck: true,
      skipBaselineCheck: true,
      logger: silentLogger,
    }),
    /COLLISION ERROR.*conflicting house title/
  );
});

test("duplicate request pairs are rejected by fixture validation", async () => {
  const badRequests = [
    { studentKey: "student-01", houseKey: "house-1", status: "PENDING" },
    { studentKey: "student-01", houseKey: "house-1", status: "APPROVED" },
  ];

  await assert.rejects(
    validateFixtures({ requestsOverride: badRequests }),
    /DUPLICATE REQUEST FIXTURE.*student-01 already has request for house-1/
  );
});

test("duplicate membership pairs are rejected by fixture validation", async () => {
  const badMemberships = [
    { studentKey: "student-01", houseKey: "house-1", status: "ACTIVE" },
    { studentKey: "student-01", houseKey: "house-1", status: "ACTIVE" },
  ];

  await assert.rejects(
    validateFixtures({ membershipsOverride: badMemberships }),
    /DUPLICATE MEMBERSHIP FIXTURE.*student-01 already member of house-1/
  );
});

test("all 87 standard fixtures are schema-valid", async () => {
  const validation = await validateFixtures();
  assert.equal(validation.total, 87);
  assert.equal(validation.counts.owners, 4);
  assert.equal(validation.counts.students, 12);
  assert.equal(validation.counts.houses, 8);
  assert.equal(validation.counts.requests, 17);
  assert.equal(validation.counts.memberships, 11);
  assert.equal(validation.counts.communityPosts, 22);
  assert.equal(validation.counts.maintenanceIssues, 13);
});

test("invalid Owner announcement relationships are rejected", async () => {
  // Post claims to be ANNOUNCEMENT on house-3, but author is owner-1 who does not own house-3
  const badPosts = [
    {
      authorKey: "owner-1",
      houseKey: "house-3",
      type: "ANNOUNCEMENT",
      content: "Invalid announcement by non-owning landlord",
    },
  ];

  await assert.rejects(
    validateFixtures({ communityPostsOverride: badPosts }),
    /Owner announcement authorization failure: owner-1 does not own house-3/
  );
});

test("invalid resident posts and maintenance complaints are rejected", async () => {
  // student-04 is NOT an active member of house-1
  const badMaintenance = [
    {
      studentKey: "student-04",
      houseKey: "house-1",
      title: "Broken fan in room",
      description: "Fan is making loud rattling noise",
      priority: "MEDIUM",
    },
  ];

  await assert.rejects(
    validateFixtures({ maintenanceIssuesOverride: badMaintenance }),
    /Maintenance issue authorization failure: student-04 is not an active resident of house-1/
  );
});

test("successful fixture insertion and idempotency tested with mock database", async () => {
  const mockDb = createMockDatabase(mockBaseline);
  const mockConnection = { host: "127.0.0.1", port: 27017, name: "boarding_db", db: mockDb };

  // First apply: Inserts 87 documents and creates COMPLETED manifest
  const applyRes = await runSeeder({
    isApply: true,
    confirmArg: true,
    envConfirm: "yes",
    demoPassword: "SecretDemoPassword123!",
    backupPath: TEST_BACKUP_PATH,
    expectedBackupSha: TEST_BACKUP_SHA256,
    connection: mockConnection,
    dbOverride: mockDb,
    skipAssetCheck: true,
    logger: silentLogger,
  });

  assert.equal(applyRes.status, "APPLIED_SUCCESS");
  assert.equal(applyRes.writes, 87);

  // Verify manifest exists and is marked COMPLETED
  const manifest = await mockDb.collection("_seed_manifest").findOne();
  assert.ok(manifest);
  assert.equal(manifest.state, "COMPLETED");
  assert.ok(manifest.completedAt);
  assert.equal(manifest.recordCounts.total, 87);

  // Verify total document counts in mock database
  assert.equal(mockDb._store.get("users").length, 4 + 16);
  assert.equal(mockDb._store.get("boardinghouses").length, 1 + 8);
  assert.equal(mockDb._store.get("accommodationrequests").length, 2 + 17);
  assert.equal(mockDb._store.get("memberships").length, 2 + 11);
  assert.equal(mockDb._store.get("communityposts").length, 2 + 22);
  assert.equal(mockDb._store.get("maintenanceissues").length, 1 + 13);

  // Existing baseline records across all collections were strictly untouched:
  assert.equal(
    mockDb._store.get("users").find((u) => u.email === "existing.owner@real.lk")?.name,
    "Existing Owner"
  );
  assert.equal(
    mockDb._store.get("boardinghouses").find((h) => h.title === "Existing Original House")?.city,
    "Matara"
  );

  // Second apply: Detects existing COMPLETED manifest and performs zero writes (idempotency)
  const secondApplyRes = await runSeeder({
    isApply: true,
    confirmArg: true,
    envConfirm: "yes",
    demoPassword: "SecretDemoPassword123!",
    backupPath: TEST_BACKUP_PATH,
    expectedBackupSha: TEST_BACKUP_SHA256,
    connection: mockConnection,
    dbOverride: mockDb,
    skipAssetCheck: true,
    logger: silentLogger,
  });

  assert.equal(secondApplyRes.status, "ALREADY_SEEDED");
  assert.equal(secondApplyRes.writes, 0);

  // Total counts remained identical
  assert.equal(mockDb._store.get("users").length, 20);
  assert.equal(mockDb._store.get("boardinghouses").length, 9);
});

test("partial-failure handling leaves incomplete manifest and refuses unsafe retries", async () => {
  const mockDb = createMockDatabase(mockBaseline);

  // Simulate partial failure during house insertion
  const originalInsertMany = mockDb.collection("boardinghouses").insertMany;
  mockDb.collection("boardinghouses").insertMany = async () => {
    throw new Error("Simulated storage failure during house insertion");
  };

  const mockConnection = { host: "127.0.0.1", port: 27017, name: "boarding_db", db: mockDb };

  await assert.rejects(
    runSeeder({
      isApply: true,
      confirmArg: true,
      envConfirm: "yes",
      demoPassword: "SecretDemoPassword123!",
      backupPath: TEST_BACKUP_PATH,
      expectedBackupSha: TEST_BACKUP_SHA256,
      connection: mockConnection,
      dbOverride: mockDb,
      skipAssetCheck: true,
      logger: silentLogger,
    }),
    /Simulated storage failure during house insertion/
  );

  // Manifest must exist and must remain IN_PROGRESS
  const manifest = await mockDb.collection("_seed_manifest").findOne();
  assert.ok(manifest, "Manifest must be written before document insertion");
  assert.equal(manifest.state, "IN_PROGRESS");
  assert.equal(manifest.completedAt, null);

  // Restore insertMany and attempt subsequent run
  mockDb.collection("boardinghouses").insertMany = originalInsertMany;

  // Subsequent run must fail closed with explicit incomplete state warning
  await assert.rejects(
    runSeeder({
      isApply: true,
      confirmArg: true,
      envConfirm: "yes",
      demoPassword: "SecretDemoPassword123!",
      backupPath: TEST_BACKUP_PATH,
      expectedBackupSha: TEST_BACKUP_SHA256,
      connection: mockConnection,
      dbOverride: mockDb,
      skipAssetCheck: true,
      logger: silentLogger,
    }),
    /Incomplete seed state detected.*Halting execution to prevent data corruption/
  );
});
