# IAS Public Analytics API Documentation

The **IAS Public Analytics API** provides unauthenticated access to open data and aggregated statistical insights for the CHED International Affairs Service (IAS) Regional Accomplishment Dashboard.

## Base URL

```
GET http://localhost:5000/api/public/analytics
```

---

## Authentication & Headers

- **Authentication**: None required (Public access).
- **CORS**: Enabled (`Access-Control-Allow-Origin: *`).
- **Response Format**: `application/json`
- **Cache-Control**: `public, max-age=60`

---

## Endpoints Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| [`/`](#0-api-index) | `GET` | **API Directory Index** listing all available public endpoints with direct links |
| [`/summary`](#1-summary) | `GET` | Aggregated KPI stats (accomplishments, targets, completion rate, YoY growth) |
| [`/regions`](#2-regions) | `GET` | Performance statistics and rankings across all 17 CHED regions |
| [`/categories`](#3-categories) | `GET` | Aggregated totals and indicator metrics per IAS category (CAT-1 to CAT-7) |
| [`/trends`](#4-trends) | `GET` | Monthly and quarterly accomplishment time-series trend data |
| [`/indicators`](#5-indicators) | `GET` | Accomplishment performance totals and targets per indicator |
| [`/matrix`](#6-matrix) | `GET` | 17-Region × 7-Category cross-tabulation accomplishment matrix |
| [`/activities`](#7-activities) | `GET` | Paginated public log of Category 7 activities and special initiatives |
| [`/export`](#8-export) | `GET` | **Complete Snapshot Export** — All open-data metrics in a single payload |

---

## Endpoint Details & Examples

### 1. Summary

**`GET /api/public/analytics/summary`**

#### Query Parameters
- `reportingYear` *(optional, number)*: Target calendar year (e.g. `2026`). Default: current year.
- `regionId` *(optional, string)*: MongoDB ObjectId of specific CHED region.

#### Sample Response (`200 OK`)
```json
{
  "status": "success",
  "meta": {
    "timestamp": "2026-08-15T22:30:00.000Z",
    "reportingYear": 2026,
    "regionFilter": "All Regions"
  },
  "data": {
    "reportingYear": 2026,
    "totalAccomplishments": 1420,
    "totalTarget": 1700,
    "accomplishmentRate": 83.53,
    "totalActivities": 120,
    "totalRegions": 17,
    "participatingRegionsCount": 17,
    "totalIndicators": 18,
    "previousYearTotal": 1250,
    "yoyGrowthPercentage": 13.6
  }
}
```

---

### 2. Regions Analytics

**`GET /api/public/analytics/regions`**

#### Query Parameters
- `reportingYear` *(optional, number)*: Target calendar year.
- `categoryId` *(optional, string)*: Filter by Category ObjectId.

#### Sample Response (`200 OK`)
```json
{
  "status": "success",
  "meta": {
    "timestamp": "2026-08-15T22:30:00.000Z",
    "reportingYear": 2026,
    "totalRegions": 17
  },
  "data": [
    {
      "_id": "64bf2...",
      "regionCode": "NCR",
      "regionName": "CHED National Capital Region",
      "shortName": "NCR",
      "totalAccomplishments": 210,
      "totalTarget": 250,
      "accomplishmentRate": 84,
      "entriesCount": 42,
      "rank": 1
    }
  ]
}
```

---

### 3. Categories Analytics

**`GET /api/public/analytics/categories`**

#### Query Parameters
- `reportingYear` *(optional, number)*: Target calendar year.
- `regionId` *(optional, string)*: Filter by Region ObjectId.

---

### 4. Trends

**`GET /api/public/analytics/trends`**

#### Query Parameters
- `reportingYear` *(optional, number)*: Target calendar year.
- `regionId` *(optional, string)*: Filter by Region ObjectId.
- `categoryId` *(optional, string)*: Filter by Category ObjectId.

---

### 5. Indicators Analytics

**`GET /api/public/analytics/indicators`**

---

### 6. Regional Category Matrix

**`GET /api/public/analytics/matrix`**

Returns a matrix payload containing category totals per region across CAT-1 to CAT-7:
```json
{
  "status": "success",
  "data": [
    {
      "_id": "64bf2...",
      "regionCode": "R01",
      "shortName": "Region I",
      "categories": {
        "CAT-1": 15,
        "CAT-2": 8,
        "CAT-3": 4,
        "CAT-4": 12,
        "CAT-5": 6,
        "CAT-6": 9,
        "CAT-7": 5
      },
      "totalAccomplishments": 59
    }
  ]
}
```

---

### 7. Public Activities Log

**`GET /api/public/analytics/activities`**

#### Query Parameters
- `page` *(optional, number)*: Page index (default: `1`).
- `limit` *(optional, number)*: Items per page (default: `20`, max: `100`).
- `search` *(optional, string)*: Text query to search in activity titles and descriptions.

---

### 8. Full Snapshot Export

**`GET /api/public/analytics/export`**

Provides a single snapshot export containing all open data fields suitable for third-party consumers.

---

## Example cURL Commands

```bash
# Get 2026 Summary
curl -X GET "http://localhost:5000/api/public/analytics/summary?reportingYear=2026"

# Get Regional Rankings
curl -X GET "http://localhost:5000/api/public/analytics/regions?reportingYear=2026"

# Get Accomplishment Matrix
curl -X GET "http://localhost:5000/api/public/analytics/matrix?reportingYear=2026"

# Search Activities
curl -X GET "http://localhost:5000/api/public/analytics/activities?search=international"
```
