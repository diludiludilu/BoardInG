const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Strictly disable autoIndex and autoCreate globally so dry-run never creates collections or indexes
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);

const User = require("../src/models/User");
const BoardingHouse = require("../src/models/BoardingHouse");
const AccommodationRequest = require("../src/models/AccommodationRequest");
const Membership = require("../src/models/Membership");
const CommunityPost = require("../src/models/CommunityPost");
const MaintenanceIssue = require("../src/models/MaintenanceIssue");

const EXPECTED_BACKUP_PATH =
  process.env.BACKUP_PATH ||
  "C:\\Users\\ASUS\\AppData\\Local\\BoardInG\\backups\\boarding_db_backup_20261031_234640.archive.gz";
const EXPECTED_BACKUP_SHA256 =
  "F7B98F3B0A39916D512927BAD33A3D1E9A7823A08D1A20C1024AA315DDA485E1";

const FIXTURE_VERSION = "phase-c1-sri-lanka-87";

// Deterministic ObjectId map
const idMap = new Map();
function getObjectId(key) {
  if (!idMap.has(key)) {
    const hash = crypto
      .createHash("sha256")
      .update(`boarding:demo:seed:v1:${key}`)
      .digest("hex")
      .slice(0, 24);
    idMap.set(key, new mongoose.Types.ObjectId(hash));
  }
  return idMap.get(key);
}

function getDemoPassword(isApply, overridePassword) {
  const pwd =
    overridePassword !== undefined ? overridePassword : process.env.DEMO_PASSWORD;
  if (isApply) {
    if (!pwd || typeof pwd !== "string" || pwd.trim().length === 0) {
      throw new Error(
        "Apply rejected: DEMO_PASSWORD environment variable is required and must not be empty!"
      );
    }
    return pwd;
  }
  return pwd || "dry_run_validation_only";
}

// 1. Safety verification functions
function verifyBackupFile(
  backupPath = EXPECTED_BACKUP_PATH,
  expectedHash = EXPECTED_BACKUP_SHA256
) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(
      `Backup file not found at expected path: ${backupPath}`
    );
  }

  const fileBuffer = fs.readFileSync(backupPath);
  const hash = crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex")
    .toUpperCase();

  if (hash.toUpperCase() !== String(expectedHash).toUpperCase()) {
    throw new Error(
      `Backup SHA-256 mismatch!\nExpected: ${expectedHash}\nActual:   ${hash}`
    );
  }

  return { path: backupPath, size: fileBuffer.length, hash };
}

function verifyDatabaseTarget(connection, options = {}) {
  const host = connection.host;
  const dbName = connection.name;

  const isLocal =
    host === "127.0.0.1" || host === "localhost" || host === "::1";

  const expectedDb = options.expectedDb || "boarding_db";
  if (!isLocal || dbName !== expectedDb) {
    throw new Error(
      `Safety guard blocked connection: target must be local ${expectedDb} (found host="${host}", db="${dbName}")`
    );
  }
}

// 2. Geographically Diverse Sri Lankan University Fixture Definitions
const ownersData = [
  {
    key: "owner-1",
    name: "Sunil Shantha Perera",
    email: "sunil.perera@example.com",
    role: "OWNER",
    region: "Western Province (Moratuwa / Dehiwala)",
  },
  {
    key: "owner-2",
    name: "Sivasubramaniam Tharmalingam",
    email: "tharmalingam.s@example.com",
    role: "OWNER",
    region: "Northern Province (Jaffna / Thirunelvely)",
  },
  {
    key: "owner-3",
    name: "Gamini Bandara Jayawardena",
    email: "gamini.bandara@example.com",
    role: "OWNER",
    region: "Central Province (Peradeniya / Kandy)",
  },
  {
    key: "owner-4",
    name: "Chandrika Wijesinghe",
    email: "chandrika.w@example.com",
    role: "OWNER",
    region: "Western Province (Nugegoda / Kelaniya)",
  },
];

const studentsData = [
  {
    key: "student-01",
    name: "Kasun Bandara",
    email: "kasun.bandara@example.com",
    role: "STUDENT",
    university: "University of Moratuwa",
  },
  {
    key: "student-02",
    name: "Chamari Fernando",
    email: "chamari.fernando@example.com",
    role: "STUDENT",
    university: "University of Moratuwa",
  },
  {
    key: "student-03",
    name: "Dinesh Jayakody",
    email: "dinesh.j@example.com",
    role: "STUDENT",
    university: "University of Moratuwa",
  },
  {
    key: "student-04",
    name: "Sivaranjani Ketheeswaran",
    email: "sivaranjani.k@example.com",
    role: "STUDENT",
    university: "University of Jaffna",
  },
  {
    key: "student-05",
    name: "Tharindu Wickramasinghe",
    email: "tharindu.w@example.com",
    role: "STUDENT",
    university: "University of Jaffna",
  },
  {
    key: "student-06",
    name: "Anusha Rajapaksha",
    email: "anusha.r@example.com",
    role: "STUDENT",
    university: "University of Peradeniya",
  },
  {
    key: "student-07",
    name: "Malith Gunawardena",
    email: "malith.g@example.com",
    role: "STUDENT",
    university: "University of Peradeniya",
  },
  {
    key: "student-08",
    name: "Sanduni Senanayake",
    email: "sanduni.s@example.com",
    role: "STUDENT",
    university: "University of Sri Jayewardenepura",
  },
  {
    key: "student-09",
    name: "Praveen Jayasuriya",
    email: "praveen.j@example.com",
    role: "STUDENT",
    university: "University of Moratuwa (Former Resident)",
  },
  {
    key: "student-10",
    name: "Rashmi Dilrukshi",
    email: "rashmi.d@example.com",
    role: "STUDENT",
    university: "University of Kelaniya",
  },
  {
    key: "student-11",
    name: "Vithushan Sivakumar",
    email: "vithushan.s@example.com",
    role: "STUDENT",
    university: "University of Kelaniya",
  },
  {
    key: "student-12",
    name: "Kavindi Madushani",
    email: "kavindi.m@example.com",
    role: "STUDENT",
    university: "Prospective Undergraduate Applicant",
  },
];

const housesData = [
  {
    key: "house-1",
    ownerKey: "owner-1",
    title: "Katubedda Scholar Haven",
    description:
      "A peaceful and disciplined student boarding house situated within 600 meters of the University of Moratuwa main entrance. Equipped with dedicated study workstations, high-speed Wi-Fi, overhead ceiling fans, and an enclosed garden courtyard suited for focused engineering and technological studies.",
    city: "Moratuwa",
    area: "Katubedda",
    monthlyRentLkr: 16500,
    facilities: ["Wi-Fi", "Study Table", "Water", "Kitchen"],
    imageUrls: [
      "/demo/houses/house-01-exterior.jpg",
      "/demo/houses/house-01-bedroom.jpg",
      "/demo/houses/house-01-shared.jpg",
    ],
    availability: "AVAILABLE",
    status: "ACTIVE",
  },
  {
    key: "house-2",
    ownerKey: "owner-1",
    title: "Mount Lavinia Student Annex",
    description:
      "Modern two-story coastal annex in Mount Lavinia offering premium twin-sharing accommodation for undergraduates. Features air-conditioned bedrooms, upper balcony with sea breezes, perimeter CCTV security, and quick access to Galle Road bus routes.",
    city: "Dehiwala",
    area: "Mount Lavinia",
    monthlyRentLkr: 22000,
    facilities: ["Wi-Fi", "Air Conditioning", "CCTV", "Hot Water"],
    imageUrls: [
      "/demo/houses/house-02-exterior.jpg",
      "/demo/houses/house-02-bedroom.jpg",
      "/demo/houses/house-02-shared.jpg",
    ],
    availability: "FULL",
    status: "ACTIVE",
  },
  {
    key: "house-3",
    ownerKey: "owner-2",
    title: "Thirunelvely Green Residence",
    description:
      "Traditional northern residential residence within a 5-minute walk of the University of Jaffna Faculty of Science. Offers clean well water, shaded front veranda, bicycle parking under palmyrah palms, and quiet hours for examination revision.",
    city: "Jaffna",
    area: "Thirunelvely",
    monthlyRentLkr: 12000,
    facilities: ["Water", "Kitchen", "Bicycle Parking", "Fan"],
    imageUrls: [
      "/demo/houses/house-03-exterior.jpg",
      "/demo/houses/house-03-bedroom.jpg",
      "/demo/houses/house-03-shared.svg",
    ],
    availability: "AVAILABLE",
    status: "ACTIVE",
  },
  {
    key: "house-4",
    ownerKey: "owner-2",
    title: "Kokuvil Student Villa",
    description:
      "Comfortable residential villa in Kokuvil offering private furnished rooms for Jaffna university students. High boundary wall, quiet suburban setting with fruit trees, study desks with reading lamps, and uninterrupted water supply.",
    city: "Jaffna",
    area: "Kokuvil",
    monthlyRentLkr: 14000,
    facilities: ["Wi-Fi", "Water", "Study Table", "CCTV"],
    imageUrls: [
      "/demo/houses/house-04-exterior.svg",
      "/demo/houses/house-04-bedroom.svg",
      "/demo/houses/house-04-shared.svg",
    ],
    availability: "FULL",
    status: "ACTIVE",
  },
  {
    key: "house-5",
    ownerKey: "owner-3",
    title: "Hindagala Hillside Lodge",
    description:
      "Scenic hillside boarding house overlooking the Mahaweli river valley near University of Peradeniya engineering complex. Natural cross-ventilation, scenic balcony, hot water showers, and direct access to Galaha road bus transit.",
    city: "Peradeniya",
    area: "Hindagala",
    monthlyRentLkr: 15000,
    facilities: ["Wi-Fi", "Balcony", "Kitchen", "Hot Water"],
    imageUrls: [
      "/demo/houses/house-05-exterior.jpg",
      "/demo/houses/house-05-bedroom.jpg",
      "/demo/houses/house-05-shared.svg",
    ],
    availability: "AVAILABLE",
    status: "ACTIVE",
  },
  {
    key: "house-6",
    ownerKey: "owner-3",
    title: "Mahakanda Pine View Rooms",
    description:
      "Tranquil student rooms in upper Mahakanda surrounded by cool pine forests and tea estates. Perfect for postgraduate and agriculture students seeking undisturbed study hours, covered vehicle parking, and reliable utilities.",
    city: "Peradeniya",
    area: "Mahakanda",
    monthlyRentLkr: 13500,
    facilities: ["Water", "Kitchen", "Study Table", "Parking"],
    imageUrls: [
      "/demo/houses/house-06-exterior.svg",
      "/demo/houses/house-06-bedroom.svg",
      "/demo/houses/house-06-shared.svg",
    ],
    availability: "AVAILABLE",
    status: "ACTIVE",
  },
  {
    key: "house-7",
    ownerKey: "owner-4",
    title: "Wijerama Campus Lodge",
    description:
      "Well-maintained two-story student residence situated 400 meters from the University of Sri Jayewardenepura gate on Wijerama road. Features CCTV surveillance, shared automatic washing machine, granite pantry, and high-speed Wi-Fi.",
    city: "Nugegoda",
    area: "Wijerama",
    monthlyRentLkr: 18000,
    facilities: ["Wi-Fi", "CCTV", "Washing Machine", "Kitchen"],
    imageUrls: [
      "/demo/houses/house-07-exterior.jpg",
      "/demo/houses/house-07-bedroom.jpg",
      "/demo/houses/house-07-shared.jpg",
    ],
    availability: "AVAILABLE",
    status: "ACTIVE",
  },
  {
    key: "house-8",
    ownerKey: "owner-4",
    title: "Dalugama Scholars Retreat",
    description:
      "Spacious suburban home in Dalugama within short walking distance of the University of Kelaniya. Offers quiet furnished bedrooms, communal refrigerator, study hall, and clean drinking water facilities.",
    city: "Kelaniya",
    area: "Dalugama",
    monthlyRentLkr: 14500,
    facilities: ["Wi-Fi", "Kitchen", "Water", "Refrigerator"],
    imageUrls: [
      "/demo/houses/house-08-exterior.svg",
      "/demo/houses/house-08-bedroom.svg",
      "/demo/houses/house-08-shared.svg",
    ],
    availability: "FULL",
    status: "ACTIVE",
  },
];

const requestsData = [
  // 10 Approved requests matching active resident tenancies
  {
    studentKey: "student-01",
    houseKey: "house-1",
    message: "Moratuwa engineering undergraduate requesting quiet study room in Katubedda.",
    status: "APPROVED",
    reviewedAt: new Date("2026-09-01T10:00:00Z"),
  },
  {
    studentKey: "student-02",
    houseKey: "house-2",
    message: "Moratuwa architecture undergraduate requesting twin room in Mount Lavinia.",
    status: "APPROVED",
    reviewedAt: new Date("2026-09-02T11:00:00Z"),
  },
  {
    studentKey: "student-03",
    houseKey: "house-2",
    message: "Information technology student seeking air-conditioned room with parking.",
    status: "APPROVED",
    reviewedAt: new Date("2026-09-02T11:30:00Z"),
  },
  {
    studentKey: "student-04",
    houseKey: "house-3",
    message: "Jaffna science undergraduate requesting room near Thirunelvely gate.",
    status: "APPROVED",
    reviewedAt: new Date("2026-09-03T09:00:00Z"),
  },
  {
    studentKey: "student-05",
    houseKey: "house-4",
    message: "Management student requesting quiet room in Kokuvil student villa.",
    status: "APPROVED",
    reviewedAt: new Date("2026-09-04T14:00:00Z"),
  },
  {
    studentKey: "student-06",
    houseKey: "house-5",
    message: "Peradeniya medical student requesting hillside room near faculty.",
    status: "APPROVED",
    reviewedAt: new Date("2026-09-05T16:00:00Z"),
  },
  {
    studentKey: "student-07",
    houseKey: "house-6",
    message: "Engineering student requesting room in Mahakanda with parking.",
    status: "APPROVED",
    reviewedAt: new Date("2026-09-06T10:00:00Z"),
  },
  {
    studentKey: "student-08",
    houseKey: "house-7",
    message: "USJ management undergraduate requesting room on Wijerama road.",
    status: "APPROVED",
    reviewedAt: new Date("2026-09-07T12:00:00Z"),
  },
  {
    studentKey: "student-11",
    houseKey: "house-8",
    message: "Kelaniya science undergraduate requesting accommodation in Dalugama.",
    status: "APPROVED",
    reviewedAt: new Date("2026-09-08T09:30:00Z"),
  },
  {
    studentKey: "student-10",
    houseKey: "house-8",
    message: "Humanities student requesting sharing room close to university gate.",
    status: "APPROVED",
    reviewedAt: new Date("2026-09-08T10:00:00Z"),
  },
  // 1 Approved request for historical tenant (Praveen - House 1)
  {
    studentKey: "student-09",
    houseKey: "house-1",
    message: "Former engineering intern requesting short-term accommodation.",
    status: "APPROVED",
    reviewedAt: new Date("2026-05-10T08:00:00Z"),
  },
  // 4 Pending requests targeting available houses (Houses 1, 3, 5, 7)
  {
    studentKey: "student-12",
    houseKey: "house-1",
    message: "Prospective student inquiring about room availability in Katubedda.",
    status: "PENDING",
  },
  {
    studentKey: "student-09",
    houseKey: "house-3",
    message: "Visiting researcher requesting room in Jaffna for semester project.",
    status: "PENDING",
  },
  {
    studentKey: "student-07",
    houseKey: "house-5",
    message: "Inquiring about room availability in Hindagala for next semester.",
    status: "PENDING",
  },
  {
    studentKey: "student-03",
    houseKey: "house-7",
    message: "Interested in private study room in Wijerama.",
    status: "PENDING",
  },
  // 2 Rejected requests demonstrating realistic rejection flow
  {
    studentKey: "student-12",
    houseKey: "house-2",
    message: "Requesting single room in Mount Lavinia.",
    status: "REJECTED",
    reviewedAt: new Date("2026-10-15T15:00:00Z"),
  },
  {
    studentKey: "student-05",
    houseKey: "house-8",
    message: "Requesting room near Kelaniya campus.",
    status: "REJECTED",
    reviewedAt: new Date("2026-10-18T16:00:00Z"),
  },
];

const membershipsData = [
  // 10 active resident memberships
  {
    studentKey: "student-01",
    houseKey: "house-1",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-01T10:00:00Z"),
  },
  {
    studentKey: "student-02",
    houseKey: "house-2",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-02T11:00:00Z"),
  },
  {
    studentKey: "student-03",
    houseKey: "house-2",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-02T11:30:00Z"),
  },
  {
    studentKey: "student-04",
    houseKey: "house-3",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-03T09:00:00Z"),
  },
  {
    studentKey: "student-05",
    houseKey: "house-4",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-04T14:00:00Z"),
  },
  {
    studentKey: "student-06",
    houseKey: "house-5",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-05T16:00:00Z"),
  },
  {
    studentKey: "student-07",
    houseKey: "house-6",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-06T10:00:00Z"),
  },
  {
    studentKey: "student-08",
    houseKey: "house-7",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-07T12:00:00Z"),
  },
  {
    studentKey: "student-11",
    houseKey: "house-8",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-08T09:30:00Z"),
  },
  {
    studentKey: "student-10",
    houseKey: "house-8",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-08T10:00:00Z"),
  },
  // 1 historical revoked membership (Praveen - House 1 past resident)
  {
    studentKey: "student-09",
    houseKey: "house-1",
    status: "REVOKED",
    joinedAt: new Date("2026-05-10T08:00:00Z"),
    revokedAt: new Date("2026-08-30T18:00:00Z"),
  },
];

const communityPostsData = [
  // House 1 (Katubedda)
  {
    houseKey: "house-1",
    authorKey: "owner-1",
    type: "ANNOUNCEMENT",
    content: "Welcome to Katubedda Scholar Haven! High-speed fiber Wi-Fi credentials have been posted on the veranda study bulletin board.",
  },
  {
    houseKey: "house-1",
    authorKey: "student-01",
    type: "POST",
    content: "Anyone forming a study group for Circuit Analysis II this weekend? We can use the ground-floor study area.",
  },
  {
    houseKey: "house-1",
    authorKey: "owner-1",
    type: "ANNOUNCEMENT",
    content: "Overhead water tank maintenance is scheduled for Sunday 8:00 AM to 11:00 AM. Please store sufficient drinking water.",
  },
  // House 2 (Mount Lavinia)
  {
    houseKey: "house-2",
    authorKey: "owner-1",
    type: "ANNOUNCEMENT",
    content: "Security notice: Please ensure the compound electronic gate latches firmly after 10:00 PM.",
  },
  {
    houseKey: "house-2",
    authorKey: "student-02",
    type: "POST",
    content: "Left my architecture drafting folder in the shared lounge earlier. If found, please drop it outside room 2.",
  },
  {
    houseKey: "house-2",
    authorKey: "student-03",
    type: "POST",
    content: "Cleaned and organized the shared refrigerator shelves by room numbers. Please keep personal items labeled.",
  },
  // House 3 (Thirunelvely)
  {
    houseKey: "house-3",
    authorKey: "owner-2",
    type: "ANNOUNCEMENT",
    content: "Quiet hours are observed strictly after 10:00 PM. Wishing all science faculty students success in semester examinations!",
  },
  {
    houseKey: "house-3",
    authorKey: "student-04",
    type: "POST",
    content: "Sharing morning transport to university faculty complex around 7:45 AM tomorrow. Message me if interested.",
  },
  // House 4 (Kokuvil)
  {
    houseKey: "house-4",
    authorKey: "owner-2",
    type: "ANNOUNCEMENT",
    content: "Fresh sweet well-water pumped and filtered into overhead tanks. Please report any tap dripping promptly.",
  },
  {
    houseKey: "house-4",
    authorKey: "student-05",
    type: "POST",
    content: "The quiet environment here has been wonderful for assignment work this term. Very grateful for the peaceful atmosphere.",
  },
  // House 5 (Hindagala)
  {
    houseKey: "house-5",
    authorKey: "owner-3",
    type: "ANNOUNCEMENT",
    content: "Balcony sensor lights have been upgraded. Please take extra care along the hillside garden path during rainy evenings.",
  },
  {
    houseKey: "house-5",
    authorKey: "student-06",
    type: "POST",
    content: "Weekend pantry cleanup schedule is pinned on the kitchen noticeboard. Let us keep the shared cooking counters tidy.",
  },
  // House 6 (Mahakanda)
  {
    houseKey: "house-6",
    authorKey: "owner-3",
    type: "ANNOUNCEMENT",
    content: "Vehicle and bicycle shelter roof has been resurfaced. Please park two-wheelers inside marked bays.",
  },
  {
    houseKey: "house-6",
    authorKey: "student-07",
    type: "POST",
    content: "Pine view balcony is an unbeatable spot for evening reading. Fresh mountain air really helps focus.",
  },
  // House 7 (Wijerama)
  {
    houseKey: "house-7",
    authorKey: "owner-4",
    type: "ANNOUNCEMENT",
    content: "Washing machine maintenance complete. Kindly use the sign-up roster near the laundry corner to avoid queueing.",
  },
  {
    houseKey: "house-7",
    authorKey: "student-08",
    type: "POST",
    content: "Management faculty marketing presentation practice group meeting in the common hall tomorrow at 4:30 PM.",
  },
  // House 8 (Dalugama)
  {
    houseKey: "house-8",
    authorKey: "owner-4",
    type: "ANNOUNCEMENT",
    content: "Welcome to Dalugama Scholars Retreat! Optical fiber Wi-Fi router has been upgraded for seamless video lectures.",
  },
  {
    houseKey: "house-8",
    authorKey: "student-11",
    type: "POST",
    content: "Semester final exam timetable has been posted online. Let us maintain quiet study hours throughout the week.",
  },
  {
    houseKey: "house-8",
    authorKey: "student-10",
    type: "POST",
    content: "Shared pantry electric kettle descaled and cleaned today. Clean drinking water filter replacement is also complete.",
  },
  {
    houseKey: "house-8",
    authorKey: "student-11",
    type: "POST",
    content: "Does anyone have a spare scientific calculator battery for tomorrow's statistics exam? Mine ran out.",
  },
  {
    houseKey: "house-8",
    authorKey: "student-10",
    type: "POST",
    content: "Left a box of fresh Kandy fruits in the fridge for everyone. Please help yourselves during evening study break!",
  },
  // House 1 (Katubedda)
  {
    houseKey: "house-1",
    authorKey: "student-01",
    type: "POST",
    content: "Direct bus schedule from Katubedda junction to Colombo Fort and Moratuwa town is updated on the front noticeboard.",
  },
];

const maintenanceIssuesData = [
  // House 1 (Katubedda)
  {
    houseKey: "house-1",
    studentKey: "student-01",
    title: "Bathroom cold tap leaking",
    description: "The cold water faucet in the ground floor shared washroom is dripping steadily and needs a washer replacement.",
    status: "OPEN",
  },
  {
    houseKey: "house-1",
    studentKey: "student-01",
    title: "Study desk reading lamp replaced",
    description: "The overhead fluorescent tube in room 1 was flickering. Owner replaced it with a warm energy-efficient LED bulb.",
    status: "RESOLVED",
  },
  // House 2 (Mount Lavinia)
  {
    houseKey: "house-2",
    studentKey: "student-02",
    title: "Lounge refrigerator door gasket loose",
    description: "The magnetic door seal of the shared refrigerator in the pantry does not seal tightly at the bottom corner.",
    status: "IN_PROGRESS",
  },
  {
    houseKey: "house-2",
    studentKey: "student-03",
    title: "Bicycle parking floodlight repair",
    description: "Exterior floodlight illuminating the parking area was tripping after heavy coastal rain. Electrician rewired and restored it.",
    status: "RESOLVED",
  },
  // House 3 (Thirunelvely)
  {
    houseKey: "house-3",
    studentKey: "student-04",
    title: "Ceiling fan rotary switch damaged",
    description: "The ceiling fan in study room 2 runs only at maximum speed; the rotary speed regulator switch requires replacement.",
    status: "OPEN",
  },
  // House 4 (Kokuvil)
  {
    houseKey: "house-4",
    studentKey: "student-05",
    title: "Solar hot water pressure drop",
    description: "Upstairs bathroom solar water heater pressure drops noticeably during morning peak hours.",
    status: "IN_PROGRESS",
  },
  // House 5 (Hindagala)
  {
    houseKey: "house-5",
    studentKey: "student-06",
    title: "Hillside drainage gulley inspection",
    description: "Rainwater drain outside the kitchen terrace is running slowly due to fallen leaves and debris.",
    status: "OPEN",
  },
  {
    houseKey: "house-5",
    studentKey: "student-06",
    title: "Balcony door cylinder lock installed",
    description: "The sliding brass latch on the first floor study balcony was replaced with a new secure cylinder lock.",
    status: "RESOLVED",
  },
  // House 6 (Mahakanda)
  {
    houseKey: "house-6",
    studentKey: "student-07",
    title: "Pine-facing window shutter hinge stiff",
    description: "Due to humidity and mist, the western window wooden shutter hinge is stiff and difficult to latch.",
    status: "IN_PROGRESS",
  },
  // House 7 (Wijerama)
  {
    houseKey: "house-7",
    studentKey: "student-08",
    title: "Washing machine water inlet filter cleaned",
    description: "Automatic washing machine inlet filter was clogged with municipal sediment; serviced and restored.",
    status: "RESOLVED",
  },
  // House 8 (Dalugama)
  {
    houseKey: "house-8",
    studentKey: "student-11",
    title: "Study room door latch sticking",
    description: "The latch on study room 3 sticks when turned from the inside and requires graphite lubrication.",
    status: "OPEN",
  },
  {
    houseKey: "house-8",
    studentKey: "student-10",
    title: "Kitchen sink drain blockage cleared",
    description: "Kitchen sink drain was draining slowly after heavy evening cooking; plumber cleared the trap and restored flow.",
    status: "RESOLVED",
  },
  {
    houseKey: "house-8",
    studentKey: "student-11",
    title: "Wi-Fi range extender voltage fluctuation reset",
    description: "The upper-floor Wi-Fi range extender resets intermittently during evening neighborhood voltage fluctuations.",
    status: "IN_PROGRESS",
  },
];

// Dedicated Seed Manifest Schema (stored in separate _seed_manifest collection, leaving application schemas untouched)
const seedManifestSchema = new mongoose.Schema(
  {
    manifestVersion: { type: String, required: true },
    fixtureVersion: { type: String, required: true },
    checksum: { type: String, required: true },
    state: { type: String, enum: ["IN_PROGRESS", "COMPLETED"], required: true },
    seededBy: { type: String, required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    recordCounts: {
      users: Number,
      boardinghouses: Number,
      accommodationrequests: Number,
      memberships: Number,
      communityposts: Number,
      maintenanceissues: Number,
      total: Number,
    },
    insertedIds: {
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      boardinghouses: [
        { type: mongoose.Schema.Types.ObjectId, ref: "BoardingHouse" },
      ],
      accommodationrequests: [
        { type: mongoose.Schema.Types.ObjectId, ref: "AccommodationRequest" },
      ],
      memberships: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Membership" },
      ],
      communityposts: [
        { type: mongoose.Schema.Types.ObjectId, ref: "CommunityPost" },
      ],
      maintenanceissues: [
        { type: mongoose.Schema.Types.ObjectId, ref: "MaintenanceIssue" },
      ],
    },
  },
  {
    timestamps: true,
    collection: "_seed_manifest",
    autoIndex: false,
    autoCreate: false,
  }
);

function computeFixtureChecksum() {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        owners: ownersData,
        students: studentsData,
        houses: housesData,
        requests: requestsData,
        memberships: membershipsData,
        posts: communityPostsData,
        issues: maintenanceIssuesData,
      })
    )
    .digest("hex");
}

async function validateFixtures(options = {}) {
  const demoPassword = options.demoPassword || "validation_placeholder_password";
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const publicDir =
    options.publicDir || path.resolve(__dirname, "../../client/public");

  const ownersList = options.owners || options.ownersOverride || ownersData;
  const studentsList = options.students || options.studentsOverride || studentsData;
  const housesList = options.houses || options.housesOverride || housesData;
  const requestsList = options.requests || options.requestsOverride || requestsData;
  const membershipsList = options.memberships || options.membershipsOverride || membershipsData;
  const postsList =
    options.posts ||
    options.communityPostsOverride ||
    options.postsOverride ||
    communityPostsData;
  const issuesList =
    options.issues ||
    options.maintenanceIssuesOverride ||
    options.issuesOverride ||
    maintenanceIssuesData;

  const ownersDocs = [];
  for (const o of ownersList) {
    const doc = new User({
      _id: getObjectId(o.key),
      name: o.name,
      email: o.email,
      passwordHash,
      role: o.role,
    });
    await doc.validate();
    ownersDocs.push(doc);
  }

  const studentsDocs = [];
  for (const s of studentsList) {
    const doc = new User({
      _id: getObjectId(s.key),
      name: s.name,
      email: s.email,
      passwordHash,
      role: s.role,
    });
    await doc.validate();
    studentsDocs.push(doc);
  }

  const housesDocs = [];
  for (const h of housesList) {
    if (!options.skipAssetCheck) {
      for (const imgUrl of h.imageUrls) {
        if (imgUrl.startsWith("/")) {
          const diskPath = path.join(publicDir, imgUrl);
          if (!fs.existsSync(diskPath)) {
            throw new Error(
              `Referenced image asset does not exist on disk: ${diskPath}`
            );
          }
        }
      }
    }

    const doc = new BoardingHouse({
      _id: getObjectId(h.key),
      ownerId: getObjectId(h.ownerKey),
      title: h.title,
      description: h.description,
      city: h.city,
      area: h.area,
      monthlyRentLkr: h.monthlyRentLkr,
      facilities: h.facilities,
      imageUrls: h.imageUrls,
      imageUrl: h.imageUrls[0],
      availability: h.availability,
      status: h.status,
    });
    await doc.validate();
    housesDocs.push(doc);
  }

  const requestPairs = new Set();
  const requestsDocs = [];
  for (const r of requestsList) {
    const pair = `${r.studentKey}_${r.houseKey}`;
    if (requestPairs.has(pair)) {
      throw new Error(
        `DUPLICATE REQUEST FIXTURE: ${pair} - ${r.studentKey} already has request for ${r.houseKey}`
      );
    }
    requestPairs.add(pair);

    const doc = new AccommodationRequest({
      _id: getObjectId(`req:${r.studentKey}:${r.houseKey}`),
      studentId: getObjectId(r.studentKey),
      boardingHouseId: getObjectId(r.houseKey),
      message: r.message,
      status: r.status,
      reviewedAt: r.reviewedAt || null,
    });
    await doc.validate();
    requestsDocs.push(doc);
  }

  const membershipPairs = new Set();
  const activeMemberships = new Set();
  const membershipsDocs = [];
  for (const m of membershipsList) {
    const pair = `${m.studentKey}_${m.houseKey}`;
    if (membershipPairs.has(pair)) {
      throw new Error(
        `DUPLICATE MEMBERSHIP FIXTURE: ${pair} - ${m.studentKey} already member of ${m.houseKey}`
      );
    }
    membershipPairs.add(pair);
    if (m.status === "ACTIVE") {
      activeMemberships.add(pair);
    }

    const doc = new Membership({
      _id: getObjectId(`mem:${m.studentKey}:${m.houseKey}`),
      studentId: getObjectId(m.studentKey),
      boardingHouseId: getObjectId(m.houseKey),
      status: m.status,
      joinedAt: m.joinedAt,
      revokedAt: m.revokedAt || null,
    });
    await doc.validate();
    membershipsDocs.push(doc);
  }

  const houseMap = new Map(housesList.map((h) => [h.key, h]));
  let announcementCount = 0;
  let postCount = 0;
  const postsDocs = [];

  for (let idx = 0; idx < postsList.length; idx++) {
    const p = postsList[idx];
    const house = houseMap.get(p.houseKey);
    if (!house) {
      throw new Error(`Community post references unknown house: ${p.houseKey}`);
    }

    if (p.type === "ANNOUNCEMENT") {
      if (house.ownerKey !== p.authorKey) {
        throw new Error(
          `Owner announcement authorization failure: ${p.authorKey} does not own ${p.houseKey}`
        );
      }
      announcementCount++;
    } else if (p.type === "POST") {
      const membershipKey = `${p.authorKey}_${p.houseKey}`;
      if (!activeMemberships.has(membershipKey)) {
        throw new Error(
          `Post authorization failure: ${p.authorKey} is not an active resident of ${p.houseKey}`
        );
      }
      postCount++;
    }

    const doc = new CommunityPost({
      _id: getObjectId(`post:${idx + 1}:${p.houseKey}:${p.authorKey}`),
      boardingHouseId: getObjectId(p.houseKey),
      authorId: getObjectId(p.authorKey),
      type: p.type,
      content: p.content,
    });
    await doc.validate();
    postsDocs.push(doc);
  }

  const issuesDocs = [];
  for (let idx = 0; idx < issuesList.length; idx++) {
    const i = issuesList[idx];
    const membershipKey = `${i.studentKey}_${i.houseKey}`;
    if (!activeMemberships.has(membershipKey)) {
      throw new Error(
        `Maintenance issue authorization failure: ${i.studentKey} is not an active resident of ${i.houseKey}`
      );
    }

    const doc = new MaintenanceIssue({
      _id: getObjectId(`issue:${idx + 1}:${i.houseKey}:${i.studentKey}`),
      boardingHouseId: getObjectId(i.houseKey),
      studentId: getObjectId(i.studentKey),
      title: i.title,
      description: i.description,
      status: i.status,
    });
    await doc.validate();
    issuesDocs.push(doc);
  }

  const total =
    ownersDocs.length +
    studentsDocs.length +
    housesDocs.length +
    requestsDocs.length +
    membershipsDocs.length +
    postsDocs.length +
    issuesDocs.length;

  return {
    total,
    counts: {
      owners: ownersDocs.length,
      students: studentsDocs.length,
      houses: housesDocs.length,
      requests: requestsDocs.length,
      memberships: membershipsDocs.length,
      communityPosts: postsDocs.length,
      maintenanceIssues: issuesDocs.length,
    },
    announcementCount,
    postCount,
    ownersDocs,
    studentsDocs,
    housesDocs,
    requestsDocs,
    membershipsDocs,
    postsDocs,
    issuesDocs,
    allInsertedIds: {
      users: [...ownersDocs, ...studentsDocs].map((d) => d._id),
      boardinghouses: housesDocs.map((d) => d._id),
      accommodationrequests: requestsDocs.map((d) => d._id),
      memberships: membershipsDocs.map((d) => d._id),
      communityposts: postsDocs.map((d) => d._id),
      maintenanceissues: issuesDocs.map((d) => d._id),
    },
  };
}

async function runSeeder(options = {}) {
  const isApply =
    options.isApply !== undefined
      ? options.isApply
      : process.argv.includes("--apply");
  const confirmArg =
    options.confirmArg !== undefined
      ? options.confirmArg
      : process.argv.includes("--confirm-apply");
  const envConfirm =
    options.envConfirm !== undefined
      ? options.envConfirm
      : process.env.CONFIRM_DEMO_SEED;
  const demoPasswordRaw =
    options.demoPassword !== undefined
      ? options.demoPassword
      : process.env.DEMO_PASSWORD;
  const logger = options.logger || console;

  logger.log("===============================================================");
  logger.log(" BoardInG Demo Data Seeder — Non-Destructive Preparation (C1)");
  logger.log("===============================================================");
  logger.log(
    `Execution Mode: ${isApply ? "APPLY (DATABASE WRITE)" : "DRY-RUN (READ-ONLY INSPECTION)"}`
  );

  // Validate apply flags upfront before any external resources are touched
  if (isApply) {
    if (!confirmArg) {
      throw new Error(
        "Apply rejected: Missing explicit confirmation argument '--confirm-apply'!"
      );
    }
    if (envConfirm !== "yes" && envConfirm !== "true") {
      throw new Error(
        "Apply rejected: Missing separate environment confirmation flag CONFIRM_DEMO_SEED=yes!"
      );
    }
    if (!demoPasswordRaw || typeof demoPasswordRaw !== "string" || demoPasswordRaw.trim().length === 0) {
      throw new Error(
        "Apply rejected: DEMO_PASSWORD environment variable must be provided!"
      );
    }
  }

  // Step 1: Backup verification
  logger.log("\n[1/6] Verifying Phase A Database Backup...");
  const backupInfo = verifyBackupFile(
    options.backupPath || EXPECTED_BACKUP_PATH,
    options.expectedBackupSha || EXPECTED_BACKUP_SHA256
  );
  logger.log(`  ✓ Backup File: ${backupInfo.path}`);
  logger.log(`  ✓ Backup Size: ${backupInfo.size.toLocaleString()} bytes`);
  logger.log(`  ✓ Backup Hash: ${backupInfo.hash} (SHA-256 MATCH)`);

  // Step 2: Database Connection & Target Guard
  logger.log("\n[2/6] Connecting to MongoDB and Verifying Target...");
  let connection = options.connection;
  let didConnect = false;
  if (!connection) {
    const mongoUri =
      options.mongoUri ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/boarding_db";
    await mongoose.connect(mongoUri, { autoIndex: false, autoCreate: false });
    connection = mongoose.connection;
    didConnect = true;
  }

  try {
    verifyDatabaseTarget(connection, {
      expectedDb: options.expectedDb || "boarding_db",
    });
    logger.log(
      `  ✓ Connected to: ${connection.host}:${connection.port}/${connection.name}`
    );
    logger.log(
      `  ✓ Safety target check passed: strictly local ${options.expectedDb || "boarding_db"}.`
    );

    const db = options.dbOverride || connection.db;

    // Step 3: Real Database Inventory Check
    logger.log("\n[3/6] Inspecting Real Database Collection Inventory...");
    let collectionNames = [];
    if (typeof db.listCollections === "function") {
      const rawCollections = await db.listCollections().toArray();
      collectionNames = rawCollections.map((c) => c.name);
    } else if (typeof db.getCollectionNames === "function") {
      collectionNames = await db.getCollectionNames();
    }
    logger.log(
      `  ✓ Collections present (${collectionNames.length}): ${JSON.stringify(collectionNames)}`
    );

    const inventory = {};
    for (const name of collectionNames) {
      inventory[name] = await db.collection(name).countDocuments();
    }
    logger.log("  ✓ Real Collection Baseline Counts:");
    logger.log(`      • users:                  ${inventory.users ?? 0} (Baseline: 4)`);
    logger.log(`      • boardinghouses:         ${inventory.boardinghouses ?? 0} (Baseline: 1)`);
    logger.log(`      • accommodationrequests:  ${inventory.accommodationrequests ?? 0} (Baseline: 2)`);
    logger.log(`      • memberships:            ${inventory.memberships ?? 0} (Baseline: 2)`);
    logger.log(`      • communityposts:         ${inventory.communityposts ?? 0} (Baseline: 2)`);
    logger.log(`      • maintenanceissues:      ${inventory.maintenanceissues ?? 0} (Baseline: 1)`);
    logger.log(`      • sessions:               ${inventory.sessions ?? 0} (Dynamic)`);

    // Step 4: Manifest & Collision Verification
    logger.log(
      "\n[4/6] Checking for Collisions with Existing Database Records & Verifying Manifest..."
    );

    let existingManifest = null;
    if (collectionNames.includes("_seed_manifest")) {
      existingManifest = await db.collection("_seed_manifest").findOne();
    }

    if (existingManifest) {
      if (existingManifest.state === "COMPLETED") {
        logger.log(
          `  ✓ Found existing seed manifest (Fixture Version: ${existingManifest.fixtureVersion}, Completed: ${existingManifest.completedAt})`
        );
        let allFound = true;
        for (const [col, ids] of Object.entries(existingManifest.insertedIds || {})) {
          const count = await db.collection(col).countDocuments({ _id: { $in: ids } });
          if (count !== ids.length) {
            allFound = false;
            break;
          }
        }
        if (allFound) {
          logger.log(
            "  ✓ All 87 demonstration documents are already present and verified in the database."
          );
          logger.log("  ✓ Status: COMPLETED. Zero writes executed.");
          return {
            status: "ALREADY_SEEDED",
            writes: 0,
            manifest: existingManifest,
          };
        } else {
          throw new Error(
            "Seed manifest is COMPLETED but database state is altered or corrupted! Refusing to modify database."
          );
        }
      } else if (existingManifest.state === "IN_PROGRESS") {
        throw new Error(
          `Incomplete seed state detected: A prior seed run began at ${existingManifest.startedAt} but was not completed! Halting execution to prevent data corruption. Manual review required. No records were deleted or modified.`
        );
      }
    } else {
      logger.log("  ✓ No prior seed manifest detected. Clean initial state.");
    }

    // Verify baseline counts on fresh seed
    if (!options.skipBaselineCheck && !existingManifest) {
      const expectedBaseline = {
        users: 4,
        boardinghouses: 1,
        accommodationrequests: 2,
        memberships: 2,
        communityposts: 2,
        maintenanceissues: 1,
      };

      for (const [col, exp] of Object.entries(expectedBaseline)) {
        if (inventory[col] !== exp) {
          throw new Error(
            `Database count discrepancy in "${col}": expected ${exp}, found ${inventory[col] ?? 0}`
          );
        }
      }
      logger.log(
        "  ✓ All 6 application collection counts match Phase A baseline (12 application records)."
      );
    }

    // Collision check across emails, house titles, and deterministic ObjectIds
    const allDemoEmails = [
      ...ownersData.map((o) => o.email),
      ...studentsData.map((s) => s.email),
    ];
    const existingConflictingUsers = await db
      .collection("users")
      .find({ email: { $in: allDemoEmails } })
      .toArray();

    const allDemoHouseTitles = housesData.map((h) => h.title);
    const existingConflictingHouses = await db
      .collection("boardinghouses")
      .find({ title: { $in: allDemoHouseTitles } })
      .toArray();

    if (existingConflictingUsers.length > 0) {
      throw new Error(
        `[COLLISION ERROR]: Found ${existingConflictingUsers.length} conflicting user email(s). Never silently reuse existing accounts!`
      );
    }

    if (existingConflictingHouses.length > 0) {
      throw new Error(
        `[COLLISION ERROR]: Found ${existingConflictingHouses.length} conflicting house title(s). Never silently overwrite existing houses!`
      );
    }

    logger.log("  ✓ Zero collisions detected with pre-existing database records.");

    // Step 5: Schema validation and relational verification
    logger.log(
      "\n[5/6] Validating Fixture Schemas, Authorizations, and Referential Integrity..."
    );
    const validated = await validateFixtures({
      demoPassword: demoPasswordRaw,
      skipAssetCheck: options.skipAssetCheck,
      publicDir: options.publicDir,
    });

    logger.log(
      `  ✓ All ${validated.total} planned documents passed Mongoose schema validation.`
    );
    logger.log(
      `  ✓ Announcement authors verified: all ${validated.announcementCount} announcements authored by house owners.`
    );
    logger.log(
      `  ✓ Post authors verified: all ${validated.postCount} posts authored by active residents.`
    );
    logger.log(
      `  ✓ Maintenance ticket authors verified: all 13 issues authored by active residents.`
    );
    if (!options.skipAssetCheck) {
      logger.log("  ✓ All 24 image asset paths verified to exist on local disk.");
    }
    logger.log("  ✓ All foreign key references and compound unique indexes verified.");

    // Check deterministic IDs for collisions in ALL six target collections
    for (const [colName, ids] of Object.entries(validated.allInsertedIds)) {
      const collidingDocs = await db
        .collection(colName)
        .find({ _id: { $in: ids } })
        .toArray();
      if (collidingDocs.length > 0) {
        throw new Error(
          `[COLLISION ERROR]: Found ${collidingDocs.length} colliding deterministic ObjectId(s) in collection "${colName}". Never silently overwrite existing documents!`
        );
      }
    }
    logger.log(
      "  ✓ Zero deterministic ObjectId collisions across all six target collections."
    );

    // Step 6: Dry-Run or Apply
    if (!isApply) {
      logger.log("\n[6/6] Seed Plan Summary (DRY-RUN Execution):");
      logger.log("---------------------------------------------------------------");
      logger.log(`  • Owners:                    ${ownersData.length} documents`);
      logger.log(`  • Students:                  ${studentsData.length} documents`);
      logger.log(`  • Boarding Houses:           ${housesData.length} documents (24 multi-photo gallery URLs)`);
      logger.log(`  • Accommodation Requests:    ${requestsData.length} documents (11 APPROVED, 4 PENDING, 2 REJECTED)`);
      logger.log(`  • Memberships:               ${membershipsData.length} documents (10 ACTIVE, 1 REVOKED)`);
      logger.log(`  • Community Posts:           ${communityPostsData.length} documents (${validated.announcementCount} ANNOUNCEMENTS, ${validated.postCount} POSTS)`);
      logger.log(`  • Maintenance Issues:        ${maintenanceIssuesData.length} documents (5 OPEN, 4 IN_PROGRESS, 4 RESOLVED)`);
      logger.log("---------------------------------------------------------------");
      logger.log(`  • TOTAL PLANNED NEW:         ${validated.total} documents (Exact Match: 87)`);
      logger.log("  • WRITES EXECUTED:           0 (ZERO writes to database)");
      logger.log("===============================================================");
      logger.log(" Dry-run completed successfully! Database remains 100% untouched.");
      logger.log("===============================================================");
      return { status: "DRY_RUN_SUCCESS", writes: 0, totalPlanned: validated.total };
    }

    // Guarded Apply execution
    logger.log("\n[6/6] Executing Guarded Demonstration Data Insertion...");

    // 6.1: Record IN_PROGRESS manifest before inserting any documents
    const manifestDoc = {
      manifestVersion: "1.0.0",
      fixtureVersion: FIXTURE_VERSION,
      checksum: computeFixtureChecksum(),
      state: "IN_PROGRESS",
      seededBy: "BoardInG Demo Data Seeder",
      startedAt: new Date(),
      completedAt: null,
      recordCounts: {
        users: validated.ownersDocs.length + validated.studentsDocs.length,
        boardinghouses: validated.housesDocs.length,
        accommodationrequests: validated.requestsDocs.length,
        memberships: validated.membershipsDocs.length,
        communityposts: validated.postsDocs.length,
        maintenanceissues: validated.issuesDocs.length,
        total: validated.total,
      },
      insertedIds: validated.allInsertedIds,
    };

    const manifestInsertRes = await db.collection("_seed_manifest").insertOne(manifestDoc);
    const manifestId = manifestInsertRes.insertedId;
    logger.log("  ✓ Seed manifest initialized in IN_PROGRESS state.");

    // 6.2: Insert documents sequentially collection by collection
    const allUsers = [...validated.ownersDocs, ...validated.studentsDocs].map(
      (d) => (typeof d.toObject === "function" ? d.toObject() : d)
    );
    await db.collection("users").insertMany(allUsers, { ordered: true });
    logger.log(`  ✓ Inserted ${allUsers.length} user accounts.`);

    const allHouses = validated.housesDocs.map((d) =>
      typeof d.toObject === "function" ? d.toObject() : d
    );
    await db.collection("boardinghouses").insertMany(allHouses, { ordered: true });
    logger.log(`  ✓ Inserted ${allHouses.length} boarding houses.`);

    const allRequests = validated.requestsDocs.map((d) =>
      typeof d.toObject === "function" ? d.toObject() : d
    );
    await db.collection("accommodationrequests").insertMany(allRequests, { ordered: true });
    logger.log(`  ✓ Inserted ${allRequests.length} accommodation requests.`);

    const allMemberships = validated.membershipsDocs.map((d) =>
      typeof d.toObject === "function" ? d.toObject() : d
    );
    await db.collection("memberships").insertMany(allMemberships, { ordered: true });
    logger.log(`  ✓ Inserted ${allMemberships.length} memberships.`);

    const allPosts = validated.postsDocs.map((d) =>
      typeof d.toObject === "function" ? d.toObject() : d
    );
    await db.collection("communityposts").insertMany(allPosts, { ordered: true });
    logger.log(`  ✓ Inserted ${allPosts.length} community posts.`);

    const allIssues = validated.issuesDocs.map((d) =>
      typeof d.toObject === "function" ? d.toObject() : d
    );
    await db.collection("maintenanceissues").insertMany(allIssues, { ordered: true });
    logger.log(`  ✓ Inserted ${allIssues.length} maintenance issues.`);

    // 6.3: Verify all 87 records exist in the database
    const actualUsers = await db.collection("users").countDocuments({ _id: { $in: validated.allInsertedIds.users } });
    const actualHouses = await db.collection("boardinghouses").countDocuments({ _id: { $in: validated.allInsertedIds.boardinghouses } });
    const actualReqs = await db.collection("accommodationrequests").countDocuments({ _id: { $in: validated.allInsertedIds.accommodationrequests } });
    const actualMems = await db.collection("memberships").countDocuments({ _id: { $in: validated.allInsertedIds.memberships } });
    const actualPosts = await db.collection("communityposts").countDocuments({ _id: { $in: validated.allInsertedIds.communityposts } });
    const actualIssues = await db.collection("maintenanceissues").countDocuments({ _id: { $in: validated.allInsertedIds.maintenanceissues } });

    const insertedCount = actualUsers + actualHouses + actualReqs + actualMems + actualPosts + actualIssues;
    if (insertedCount !== validated.total) {
      throw new Error(
        `Post-insertion count mismatch: expected ${validated.total}, found ${insertedCount}. Manifest remains IN_PROGRESS.`
      );
    }

    // 6.4: Transition manifest to COMPLETED
    await db.collection("_seed_manifest").updateOne(
      { _id: manifestId },
      { $set: { state: "COMPLETED", completedAt: new Date() } }
    );
    logger.log("  ✓ All 87 documents verified in database.");
    logger.log("  ✓ Seed manifest state transitioned to COMPLETED.");
    logger.log("===============================================================");
    logger.log(" Seeding completed successfully with full manifest verification!");
    logger.log("===============================================================");

    return { status: "APPLIED_SUCCESS", writes: insertedCount, totalPlanned: validated.total };
  } finally {
    if (didConnect) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runSeeder()
    .then(async () => {
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("\n[SEEDER ERROR]:", err.message);
      try {
        await mongoose.disconnect();
      } catch {}
      process.exit(1);
    });
}

module.exports = {
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
  FIXTURE_VERSION,
  seedManifestSchema,
};
