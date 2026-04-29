# Nand Dairy API — Complete Postman Testing Guide
Base URL: `https://nand-dairy-backend.onrender.com`  
Local URL: `http://localhost:3000`

> **Setup**: After logging in, copy the `token` value. In Postman → **Authorization** tab → **Bearer Token** → paste token. Do this for all protected requests.

---

## 1. Health Check
**GET** `/api/health`  
No auth needed. Returns: `{ "status": "ok", "database": "connected" }`

---

## 2. Authentication
**POST** `/api/auth/login`
```json
{ "mobile_number": "9999999999", "password": "admin123" }
```
→ Returns `token` and `user` (`id`, `name`, `role`).

**Valid roles:** `admin` · `milk-entry` · `fat-snf` · `report` · `distributor`

---

## 3. Users / Staff *(Admin only)*

| Method | URL | Body |
|--------|-----|------|
| GET | `/api/users` | — |
| GET | `/api/users/:id` | — |
| POST | `/api/users` | `{ "name", "mobile_number", "password", "role" }` |
| PUT | `/api/users/:id` | `{ "name", "mobile_number", "role" }` — add `"password"` to reset |
| PATCH | `/api/users/:id/toggle-active` | `{ "is_active": false }` |
| DELETE | `/api/users/:id` | — |

**POST example:**
```json
{ "name": "Ramesh", "mobile_number": "8888888888", "password": "pass123", "role": "milk-entry" }
```

**Distributor example:**
```json
{ "name": "Kisan Traders", "mobile_number": "9876543210", "password": "dist123", "role": "distributor" }
```

---

## 4. Samitis *(Admin: POST; All roles: GET)*

| Method | URL | Body |
|--------|-----|------|
| GET | `/api/samitis` | — |
| GET | `/api/samitis/:id` | — |
| POST | `/api/samitis` | `{ "name": "Kagal Samiti" }` |

→ `code_4digit` is auto-generated.

---

## 5. Vehicles *(Admin: POST/DELETE; All: GET)*

| Method | URL | Body |
|--------|-----|------|
| GET | `/api/vehicles` | — |
| POST | `/api/vehicles` | `{ "vehicle_number": "MH09AB1234" }` |
| DELETE | `/api/vehicles/:id` | — |
| GET | `/api/vehicles/search/:vehicle_number` | — |
| POST | `/api/vehicles/:id/samitis` | `{ "samiti_id": 1 }` |
| DELETE | `/api/vehicles/:id/samitis/:samiti_id` | — |

**Search example:** `GET /api/vehicles/search/MH09AB1234`  
→ Returns array: `[{ samiti_id, samiti_name, code_4digit }]`

---

## 6. Milk Entries *(milk-entry or admin)*

| Method | URL | Notes |
|--------|-----|-------|
| POST | `/api/milk-entries` | Submit a collection |
| GET | `/api/milk-entries/today` | All today's entries |
| GET | `/api/milk-entries/today?shift=morning` | Filter by shift |
| GET | `/api/milk-entries/stats?samiti_id=1` | Today vs yesterday totals |

**POST body:**
```json
{
  "samiti_id": 1,
  "shift": "morning",
  "entry_date": "2026-04-29",
  "milk_quantity_liters": 50.5
}
```
> ⚠️ Same samiti + shift + date → **409 Conflict**

**Stats response:**
```json
{ "today_total": "150.5", "yesterday_total": "340.0" }
```

---

## 7. FAT / SNF Entries *(fat-snf or admin)*

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/fat-snf/pending` | Queue of entries awaiting testing |
| POST | `/api/fat-snf` | Submit values for a milk entry |

**POST body:**
```json
{
  "milk_entry_id": 1,
  "fat_value": 6.5,
  "snf_value": 8.5,
  "rate_per_liter": 45.0
}
```
> **Validation:** fat 0–10 · snf 0–15 · rate ≥ 0  
> `total_amount` is auto-calculated: `milk_qty × rate_per_liter`

---

## 8. Reports *(admin or report)*

| Method | URL | Query Params |
|--------|-----|-------------|
| GET | `/api/reports/daily` | `?date=2026-04-29` |
| GET | `/api/reports/bill` | `?samiti_id=1&from_date=2026-04-01&to_date=2026-04-29` |
| GET | `/api/reports/summary` | `?from_date=2026-04-22&to_date=2026-04-29` *(optional, defaults to last 7 days)* |

**Summary response:**
```json
{
  "period":  { "from": "2026-04-22", "to": "2026-04-29" },
  "summary": {
    "total_milk": "2540.0",
    "total_payout": "114300.00",
    "avg_fat": "4.80",
    "avg_snf": "8.60",
    "active_samitis": "12",
    "total_entries": "48"
  },
  "leaderboard": [
    { "samiti_name": "Kagal Samiti", "code_4digit": "4821", "total_milk": "640.0", "total_amount": "28800.00" }
  ]
}
```

---

## 9. Products *(Admin: POST/PUT/PATCH; All: GET)*

| Method | URL | Body |
|--------|-----|------|
| GET | `/api/products` | — |
| GET | `/api/products/:id` | — |
| POST | `/api/products` | `{ "name", "description", "price", "unit" }` |
| PUT | `/api/products/:id` | `{ "name", "description", "price", "unit" }` |
| PATCH | `/api/products/:id/toggle` | `{ "is_available": false }` |
| DELETE | `/api/products/:id` | Soft-deletes if ordered, hard-deletes if never ordered |

**POST example:**
```json
{ "name": "Full Cream Milk", "description": "Fresh daily", "price": "52.00", "unit": "1L Pouch" }
```

---

## 10. Orders *(Distributor: POST/GET own; Admin: GET all / PATCH pay)*

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/orders/pending-balance` | Checks if distributor is blocked |
| GET | `/api/orders` | Distributor sees own orders; Admin sees all |
| GET | `/api/orders/:id/items` | Line items for a specific order |
| POST | `/api/orders` | Place a new order (distributor only) |
| PATCH | `/api/orders/:id/pay` | Mark order as paid (admin only) |
| GET | `/api/orders/stats` | Admin: count by status |

**POST body:**
```json
{
  "items": [
    { "product_id": 1, "quantity": 5 },
    { "product_id": 2, "quantity": 2 }
  ],
  "notes": "Deliver before 8am"
}
```

**Pending-balance response:**
```json
{ "blocked": false, "pending_amount": "0.00" }
```

---

## Full Workflow Test Sequence

### Milk Collection Flow
1. ✅ `POST /api/auth/login` (admin) → get token
2. ✅ `POST /api/samitis` → note `id`
3. ✅ `POST /api/vehicles` → add vehicle  
4. ✅ `POST /api/vehicles/:id/samitis` → link to samiti
5. ✅ `GET /api/vehicles/search/MH09AB1234` → confirm lookup returns array
6. ✅ `POST /api/users` (role: `milk-entry`) → create operator
7. ✅ Login as milk-entry → `POST /api/milk-entries`
8. ✅ Login as fat-snf → `GET /api/fat-snf/pending` → `POST /api/fat-snf`
9. ✅ Login as admin → `GET /api/reports/daily?date=today`
10. ✅ `GET /api/reports/summary` → confirm hero stats

### Distributor Flow
1. ✅ `POST /api/users` (role: `distributor`) → create distributor
2. ✅ `POST /api/products` → add products
3. ✅ Login as distributor → `GET /api/orders/pending-balance`
4. ✅ `POST /api/orders` with items array
5. ✅ Login as admin → `GET /api/orders` → `PATCH /api/orders/:id/pay`
