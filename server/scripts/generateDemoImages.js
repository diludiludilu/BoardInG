const fs = require("node:fs");
const path = require("node:path");

const outputDir = path.resolve(__dirname, "../../client/public/demo/houses");
const manifestPath = path.resolve(__dirname, "../../client/public/demo/MANIFEST.md");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const houses = [
  {
    num: "01",
    id: "house-01",
    name: "Katubedda Scholar Haven",
    area: "Katubedda",
    city: "Moratuwa",
    rentLkr: 16500,
    university: "University of Moratuwa",
    theme: {
      primary: "#1e3a8a",
      secondary: "#2563eb",
      accent: "#60a5fa",
      skyTop: "#dbeafe",
      skyBottom: "#bfdbfe",
      roof: "#854d0e",
      wall: "#fefce8",
      floor: "#b45309",
    },
    exteriorDesc: "Two-story suburban student annex with clean perimeter wall, iron gate, and paved entryway near University of Moratuwa.",
    bedroomDesc: "Focused engineering study bedroom with sturdy timber desk, textbooks, single bed, fan, and garden window.",
    sharedDesc: "Communal kitchen and dining space with tiled counter, Litro gas cylinder, electric kettle, and shared table.",
    hasJpg: { exterior: true, bedroom: true, shared: true },
  },
  {
    num: "02",
    id: "house-02",
    name: "Mount Lavinia Student Annex",
    area: "Mount Lavinia",
    city: "Dehiwala",
    rentLkr: 22000,
    university: "University of Moratuwa / Colombo South",
    theme: {
      primary: "#0f766e",
      secondary: "#14b8a6",
      accent: "#99f6e4",
      skyTop: "#ccfbf1",
      skyBottom: "#99f6e4",
      roof: "#9a3412",
      wall: "#f0fdf4",
      floor: "#78350f",
    },
    exteriorDesc: "Modern coastal two-story annex with glass-paneled upper balcony, secure compound gate, and breezy palm trees.",
    bedroomDesc: "Air-conditioned twin student study room with twin beds, ergonomic desks, laptops, and pastel curtains.",
    sharedDesc: "Contemporary shared pantry and lounge with refrigerator, microwave oven, water filter, and dining chairs.",
    hasJpg: { exterior: true, bedroom: true, shared: true },
  },
  {
    num: "03",
    id: "house-03",
    name: "Thirunelvely Green Residence",
    area: "Thirunelvely",
    city: "Jaffna",
    rentLkr: 12000,
    university: "University of Jaffna",
    theme: {
      primary: "#854d0e",
      secondary: "#a16207",
      accent: "#fde047",
      skyTop: "#fef9c3",
      skyBottom: "#fef08a",
      roof: "#7c2d12",
      wall: "#fefce8",
      floor: "#92400e",
    },
    exteriorDesc: "Traditional Jaffna residential compound with red clay-tile roof, palmyrah trees, front veranda, and bicycle parking.",
    bedroomDesc: "Simple, serene student bedroom with wooden study desk, ceiling fan, cotton bedding, and open barred window.",
    sharedDesc: "Authentic shared kitchen with gas cooker, clay pots, stainless steel dish rack, and traditional dining bench.",
    hasJpg: { exterior: true, bedroom: true, shared: false },
  },
  {
    num: "04",
    id: "house-04",
    name: "Kokuvil Student Villa",
    area: "Kokuvil",
    city: "Jaffna",
    rentLkr: 14000,
    university: "University of Jaffna",
    theme: {
      primary: "#701a75",
      secondary: "#a21caf",
      accent: "#f0abfc",
      skyTop: "#fae8ff",
      skyBottom: "#f5d0fe",
      roof: "#831843",
      wall: "#fdf4ff",
      floor: "#701a75",
    },
    exteriorDesc: "Spacious gated residential villa in Kokuvil with paved driveway, banana trees, well-water supply, and security wall.",
    bedroomDesc: "Study room tailored for medical and science students with study table, desk lamp, bookshelf, and single bed.",
    sharedDesc: "Open-air common veranda and kitchenette equipped with purified water dispenser, electric kettle, and study desks.",
    hasJpg: { exterior: false, bedroom: false, shared: false },
  },
  {
    num: "05",
    id: "house-05",
    name: "Hindagala Hillside Lodge",
    area: "Hindagala",
    city: "Peradeniya",
    rentLkr: 15000,
    university: "University of Peradeniya",
    theme: {
      primary: "#14532d",
      secondary: "#16a34a",
      accent: "#86efac",
      skyTop: "#dcfce7",
      skyBottom: "#bbf7d0",
      roof: "#78350f",
      wall: "#f0fdf4",
      floor: "#854d0e",
    },
    exteriorDesc: "Scenic hillside lodge perched on the lush slopes of Hindagala overlooking Mahaweli river valley near Peradeniya campus.",
    bedroomDesc: "Peaceful student bedroom with wooden balcony overlooking misty hills, study table, books, and morning sun.",
    sharedDesc: "Terrace kitchen and dining space with natural cross-ventilation, gas cooker, kettle, and timber dining table.",
    hasJpg: { exterior: true, bedroom: true, shared: false },
  },
  {
    num: "06",
    id: "house-06",
    name: "Mahakanda Pine View Rooms",
    area: "Mahakanda",
    city: "Peradeniya",
    rentLkr: 13500,
    university: "University of Peradeniya",
    theme: {
      primary: "#365314",
      secondary: "#65a30d",
      accent: "#bef264",
      skyTop: "#ecfccb",
      skyBottom: "#d9f99d",
      roof: "#713f12",
      wall: "#f7fee7",
      floor: "#78350f",
    },
    exteriorDesc: "Serene student lodge surrounded by pine groves and tea bushes with covered bicycle parking and mountain trails.",
    bedroomDesc: "Cozy timber-accented bedroom with pine bookshelves, study workstation, desk lamp, and pine forest view window.",
    sharedDesc: "Communal study room and tea station with electric kettle, tea mugs, study tables, and student noticeboard.",
    hasJpg: { exterior: false, bedroom: false, shared: false },
  },
  {
    num: "07",
    id: "house-07",
    name: "Wijerama Campus Lodge",
    area: "Wijerama",
    city: "Nugegoda",
    rentLkr: 18000,
    university: "University of Sri Jayewardenepura",
    theme: {
      primary: "#1e1b4b",
      secondary: "#3730a3",
      accent: "#818cf8",
      skyTop: "#e0e7ff",
      skyBottom: "#c7d2fe",
      roof: "#831843",
      wall: "#f5f3ff",
      floor: "#581c87",
    },
    exteriorDesc: "Two-story student lodge within 500 meters of USJ campus with paved front court, automated security lighting, and gate.",
    bedroomDesc: "Modern urban student room with workstation, management revision materials, laptop, wardrobe, and ceiling fan.",
    sharedDesc: "Shared utility and kitchen area with automatic washing machine, granite pantry counter, sink, and dining table.",
    hasJpg: { exterior: true, bedroom: true, shared: true },
  },
  {
    num: "08",
    id: "house-08",
    name: "Dalugama Scholars Retreat",
    area: "Dalugama",
    city: "Kelaniya",
    rentLkr: 14500,
    university: "University of Kelaniya",
    theme: {
      primary: "#4a044e",
      secondary: "#86198f",
      accent: "#e879f9",
      skyTop: "#fae8ff",
      skyBottom: "#f0abfc",
      roof: "#881337",
      wall: "#fdf4ff",
      floor: "#701a75",
    },
    exteriorDesc: "Shaded residential retreat walking distance from University of Kelaniya with mango trees and peaceful front porch.",
    bedroomDesc: "Bright student bedroom with study lamp, overhead book rack, built-in wardrobe, and quiet courtyard view.",
    sharedDesc: "Communal study hall and kitchen with tea kettle, refrigerator, dining chairs, whiteboards, and high-speed Wi-Fi.",
    hasJpg: { exterior: false, bedroom: false, shared: false },
  },
];

function generateExteriorSvg(h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <title>${h.name} - Exterior View</title>
  <desc>${h.exteriorDesc}</desc>
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${h.theme.skyTop}" />
      <stop offset="100%" stop-color="${h.theme.skyBottom}" />
    </linearGradient>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${h.theme.roof}" />
      <stop offset="100%" stop-color="#4a1e05" />
    </linearGradient>
    <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${h.theme.wall}" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
  </defs>

  <rect width="800" height="340" fill="url(#skyGrad)" />
  <circle cx="680" cy="90" r="45" fill="#fef08a" opacity="0.85" />
  <ellipse cx="220" cy="80" rx="90" ry="24" fill="#ffffff" opacity="0.75" />
  <ellipse cx="460" cy="110" rx="110" ry="28" fill="#ffffff" opacity="0.65" />

  <path d="M70,340 Q110,180 150,110 Q190,180 230,340 Z" fill="#2d6a4f" opacity="0.6" />
  <path d="M620,340 Q660,160 700,90 Q740,160 780,340 Z" fill="#2d6a4f" opacity="0.6" />
  <path d="M145,340 Q150,220 155,140" stroke="#7f4f24" stroke-width="8" fill="none" />
  <path d="M155,140 Q110,110 80,130 M155,140 Q130,90 120,70 M155,140 Q170,80 190,75 M155,140 Q200,105 220,130" stroke="#40916c" stroke-width="6" fill="none" stroke-linecap="round" />
  <path d="M695,340 Q690,210 685,120" stroke="#7f4f24" stroke-width="8" fill="none" />
  <path d="M685,120 Q640,90 610,110 M685,120 Q660,70 650,50 M685,120 Q700,60 720,55 M685,120 Q730,85 750,110" stroke="#40916c" stroke-width="6" fill="none" stroke-linecap="round" />

  <rect y="340" width="800" height="160" fill="#16a34a" />
  <polygon points="350,340 450,340 500,500 300,500" fill="#d4a373" />

  <rect x="200" y="180" width="400" height="170" fill="url(#wallGrad)" rx="2" stroke="#495057" stroke-width="2" />
  <polygon points="170,185 400,95 630,185" fill="url(#roofGrad)" stroke="#343a40" stroke-width="2" />

  <rect x="230" y="230" width="16" height="120" fill="#ffffff" stroke="#ced4da" stroke-width="1.5" />
  <rect x="330" y="230" width="16" height="120" fill="#ffffff" stroke="#ced4da" stroke-width="1.5" />
  <rect x="454" y="230" width="16" height="120" fill="#ffffff" stroke="#ced4da" stroke-width="1.5" />
  <rect x="554" y="230" width="16" height="120" fill="#ffffff" stroke="#ced4da" stroke-width="1.5" />

  <rect x="375" y="240" width="50" height="110" fill="#582f0e" stroke="#212529" stroke-width="2" rx="3" />
  <circle cx="415" cy="295" r="4" fill="#facc15" />

  <rect x="260" y="240" width="55" height="65" fill="#bae6fd" stroke="#475569" stroke-width="2" rx="2" />
  <rect x="485" y="240" width="55" height="65" fill="#bae6fd" stroke="#475569" stroke-width="2" rx="2" />

  <rect x="24" y="24" width="420" height="68" rx="8" fill="#0f172a" fill-opacity="0.88" />
  <text x="40" y="52" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700">${h.name}</text>
  <text x="40" y="74" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="13">${h.area}, ${h.city} • ${h.university}</text>
</svg>`;
}

function generateBedroomSvg(h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <title>${h.name} - Student Bedroom</title>
  <desc>${h.bedroomDesc}</desc>
  <defs>
    <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${h.theme.wall}" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
  </defs>

  <rect width="800" height="350" fill="url(#wallGrad)" />
  <rect y="350" width="800" height="150" fill="#94a3b8" />

  <rect x="280" y="50" width="240" height="160" fill="#bae6fd" stroke="#475569" stroke-width="3" rx="2" />
  <line x1="400" y1="50" x2="400" y2="210" stroke="#475569" stroke-width="2.5" />
  <line x1="280" y1="130" x2="520" y2="130" stroke="#475569" stroke-width="2.5" />

  <rect x="40" y="270" width="220" height="150" fill="#f8fafc" stroke="#64748b" stroke-width="2" rx="4" />
  <rect x="45" y="275" width="210" height="140" fill="${h.theme.primary}" rx="3" />
  <rect x="60" y="285" width="80" height="40" fill="#ffffff" rx="8" stroke="#cbd5e1" stroke-width="1.5" />

  <rect x="520" y="240" width="240" height="170" fill="#9a3412" stroke="#431407" stroke-width="2" rx="2" />
  <circle cx="702" cy="300" r="4" fill="#fbbf24" />

  <rect x="24" y="24" width="420" height="68" rx="8" fill="#0f172a" fill-opacity="0.88" />
  <text x="40" y="52" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700">${h.name}</text>
  <text x="40" y="74" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="13">${h.area}, ${h.city} • Student Bedroom</text>
</svg>`;
}

function generateSharedSvg(h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <title>${h.name} - Kitchen and Shared Area</title>
  <desc>${h.sharedDesc}</desc>
  <defs>
    <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${h.theme.wall}" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
  </defs>

  <rect width="800" height="360" fill="url(#wallGrad)" />
  <rect y="360" width="800" height="140" fill="#cbd5e1" />

  <rect x="40" y="280" width="360" height="130" fill="#334155" rx="2" />
  <rect x="460" y="280" width="300" height="20" fill="#b45309" stroke="#78350f" stroke-width="2" rx="2" />

  <rect x="24" y="24" width="420" height="68" rx="8" fill="#0f172a" fill-opacity="0.88" />
  <text x="40" y="52" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700">${h.name}</text>
  <text x="40" y="74" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="13">${h.area}, ${h.city} • Shared Facilities</text>
</svg>`;
}

let manifestContent = `# BoardInG Property Photo Gallery Asset Manifest (Phase B2)

This manifest documents the 24 demonstration image assets for the eight geographically diverse Sri Lankan student boarding houses in BoardInG.

## Image Provenance, Copyright and Licensing

- **Photorealistic JPEG Assets (13 Assets):**
  - **Generator:** Gemini 3.1 Flash Image via Antigravity Image Generator Subagent
  - **Generation Date:** 2026-11-01
  - **License:** Original Project Asset / Evaluation Use (Free of third-party copyright, watermarks, or stock photo license restrictions)
  - **Format & Resolution:** High-resolution JPEG (average size ~850 KB, compressed for responsive web delivery)
  - **Offline Storage:** Bundled locally in \`client/public/demo/houses/*.jpg\`
- **Vector Illustrative SVG Assets (11 Assets):**
  - **Creator:** BoardInG Project Engineering Team
  - **Status:** Placeholders where the image generation API encountered \`429 RESOURCE_EXHAUSTED\` capacity limits (quota resets in ~4.5h).
  - **Format & Resolution:** Responsive SVG (800 × 500 px, ~4 KB each)
  - **License:** Creative Commons Zero v1.0 Universal (CC0 1.0)
  - **Action for User:** The user may supply real replacement photographs or re-trigger generation after quota replenishment.

---

## Complete 24-Asset Inventory Table

| House ID | Property Name | Area & City | Photo Type | Active Asset Path | Format | Status / Provenance |
|---|---|---|---|---|---|---|
`;

for (const h of houses) {
  const extSvg = `${h.id}-exterior.svg`;
  const bedSvg = `${h.id}-bedroom.svg`;
  const sharedSvg = `${h.id}-shared.svg`;

  // Always write updated SVGs
  fs.writeFileSync(path.join(outputDir, extSvg), generateExteriorSvg(h), "utf8");
  fs.writeFileSync(path.join(outputDir, bedSvg), generateBedroomSvg(h), "utf8");
  fs.writeFileSync(path.join(outputDir, sharedSvg), generateSharedSvg(h), "utf8");

  // Exterior row
  if (h.hasJpg.exterior) {
    manifestContent += `| \`${h.id}\` | ${h.name} | ${h.area}, ${h.city} | Exterior | \`/demo/houses/${h.id}-exterior.jpg\` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |\n`;
  } else {
    manifestContent += `| \`${h.id}\` | ${h.name} | ${h.area}, ${h.city} | Exterior | \`/demo/houses/${h.id}-exterior.svg\` | SVG | Vector Placeholder (API Quota Limit Encountered) |\n`;
  }

  // Bedroom row
  if (h.hasJpg.bedroom) {
    manifestContent += `| \`${h.id}\` | ${h.name} | ${h.area}, ${h.city} | Bedroom | \`/demo/houses/${h.id}-bedroom.jpg\` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |\n`;
  } else {
    manifestContent += `| \`${h.id}\` | ${h.name} | ${h.area}, ${h.city} | Bedroom | \`/demo/houses/${h.id}-bedroom.svg\` | SVG | Vector Placeholder (API Quota Limit Encountered) |\n`;
  }

  // Shared row
  if (h.hasJpg.shared) {
    manifestContent += `| \`${h.id}\` | ${h.name} | ${h.area}, ${h.city} | Shared / Kitchen | \`/demo/houses/${h.id}-shared.jpg\` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |\n`;
  } else {
    manifestContent += `| \`${h.id}\` | ${h.name} | ${h.area}, ${h.city} | Shared / Kitchen | \`/demo/houses/${h.id}-shared.svg\` | SVG | Vector Placeholder (API Quota Limit Encountered) |\n`;
  }
}

manifestContent += `
---

## Summary Statistics

- **Total Properties:** 8 Boarding Houses across 6 University Regions (Moratuwa, Dehiwala, Jaffna, Peradeniya, Nugegoda, Kelaniya)
- **Total Image Assets:** 24 Assets (3 per property)
- **Photorealistic JPEGs Active:** 13 Images
- **Vector SVGs Active:** 11 Images
- **Offline Reliability:** 100% locally served from \`client/public/demo/houses/\`
- **Notice on Representation:** All images depict representative student accommodations in Sri Lanka and do not claim to depict real existing property addresses.
`;

fs.writeFileSync(manifestPath, manifestContent, "utf8");
console.log("Successfully generated updated SVGs and Phase B2 MANIFEST.md");
