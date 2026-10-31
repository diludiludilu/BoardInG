# BoardInG Property Photo Gallery Asset Manifest (Phase B2)

This manifest documents the 24 demonstration image assets for the eight geographically diverse Sri Lankan student boarding houses in BoardInG.

## Image Provenance, Copyright and Licensing

- **Photorealistic JPEG Assets (13 Assets):**
  - **Generator:** Gemini 3.1 Flash Image via Antigravity Image Generator Subagent
  - **Generation Date:** 2026-11-01
  - **License:** Original Project Asset / Evaluation Use (Free of third-party copyright, watermarks, or stock photo license restrictions)
  - **Format & Resolution:** High-resolution JPEG (average size ~850 KB, compressed for responsive web delivery)
  - **Offline Storage:** Bundled locally in `client/public/demo/houses/*.jpg`
- **Vector Illustrative SVG Assets (11 Assets):**
  - **Creator:** BoardInG Project Engineering Team
  - **Status:** Placeholders where the image generation API encountered `429 RESOURCE_EXHAUSTED` capacity limits (quota resets in ~4.5h).
  - **Format & Resolution:** Responsive SVG (800 × 500 px, ~4 KB each)
  - **License:** Creative Commons Zero v1.0 Universal (CC0 1.0)
  - **Action for User:** The user may supply real replacement photographs or re-trigger generation after quota replenishment.

---

## Complete 24-Asset Inventory Table

| House ID | Property Name | Area & City | Photo Type | Active Asset Path | Format | Status / Provenance |
|---|---|---|---|---|---|---|
| `house-01` | Katubedda Scholar Haven | Katubedda, Moratuwa | Exterior | `/demo/houses/house-01-exterior.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-01` | Katubedda Scholar Haven | Katubedda, Moratuwa | Bedroom | `/demo/houses/house-01-bedroom.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-01` | Katubedda Scholar Haven | Katubedda, Moratuwa | Shared / Kitchen | `/demo/houses/house-01-shared.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-02` | Mount Lavinia Student Annex | Mount Lavinia, Dehiwala | Exterior | `/demo/houses/house-02-exterior.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-02` | Mount Lavinia Student Annex | Mount Lavinia, Dehiwala | Bedroom | `/demo/houses/house-02-bedroom.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-02` | Mount Lavinia Student Annex | Mount Lavinia, Dehiwala | Shared / Kitchen | `/demo/houses/house-02-shared.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-03` | Thirunelvely Green Residence | Thirunelvely, Jaffna | Exterior | `/demo/houses/house-03-exterior.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-03` | Thirunelvely Green Residence | Thirunelvely, Jaffna | Bedroom | `/demo/houses/house-03-bedroom.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-03` | Thirunelvely Green Residence | Thirunelvely, Jaffna | Shared / Kitchen | `/demo/houses/house-03-shared.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |
| `house-04` | Kokuvil Student Villa | Kokuvil, Jaffna | Exterior | `/demo/houses/house-04-exterior.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |
| `house-04` | Kokuvil Student Villa | Kokuvil, Jaffna | Bedroom | `/demo/houses/house-04-bedroom.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |
| `house-04` | Kokuvil Student Villa | Kokuvil, Jaffna | Shared / Kitchen | `/demo/houses/house-04-shared.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |
| `house-05` | Hindagala Hillside Lodge | Hindagala, Peradeniya | Exterior | `/demo/houses/house-05-exterior.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-05` | Hindagala Hillside Lodge | Hindagala, Peradeniya | Bedroom | `/demo/houses/house-05-bedroom.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-05` | Hindagala Hillside Lodge | Hindagala, Peradeniya | Shared / Kitchen | `/demo/houses/house-05-shared.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |
| `house-06` | Mahakanda Pine View Rooms | Mahakanda, Peradeniya | Exterior | `/demo/houses/house-06-exterior.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |
| `house-06` | Mahakanda Pine View Rooms | Mahakanda, Peradeniya | Bedroom | `/demo/houses/house-06-bedroom.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |
| `house-06` | Mahakanda Pine View Rooms | Mahakanda, Peradeniya | Shared / Kitchen | `/demo/houses/house-06-shared.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |
| `house-07` | Wijerama Campus Lodge | Wijerama, Nugegoda | Exterior | `/demo/houses/house-07-exterior.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-07` | Wijerama Campus Lodge | Wijerama, Nugegoda | Bedroom | `/demo/houses/house-07-bedroom.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-07` | Wijerama Campus Lodge | Wijerama, Nugegoda | Shared / Kitchen | `/demo/houses/house-07-shared.jpg` | JPEG | Photorealistic Generated (Gemini 3.1 Flash Image) |
| `house-08` | Dalugama Scholars Retreat | Dalugama, Kelaniya | Exterior | `/demo/houses/house-08-exterior.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |
| `house-08` | Dalugama Scholars Retreat | Dalugama, Kelaniya | Bedroom | `/demo/houses/house-08-bedroom.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |
| `house-08` | Dalugama Scholars Retreat | Dalugama, Kelaniya | Shared / Kitchen | `/demo/houses/house-08-shared.svg` | SVG | Vector Placeholder (API Quota Limit Encountered) |

---

## Summary Statistics

- **Total Properties:** 8 Boarding Houses across 6 University Regions (Moratuwa, Dehiwala, Jaffna, Peradeniya, Nugegoda, Kelaniya)
- **Total Image Assets:** 24 Assets (3 per property)
- **Photorealistic JPEGs Active:** 13 Images
- **Vector SVGs Active:** 11 Images
- **Offline Reliability:** 100% locally served from `client/public/demo/houses/`
- **Notice on Representation:** All images depict representative student accommodations in Sri Lanka and do not claim to depict real existing property addresses.
