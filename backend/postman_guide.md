# Nand Dairy API - Postman Testing Guide

The backend is now running locally on ` http://localhost:5001`. This guide explains how to test all the endpoints.

## 1. Authentication

First, log in as the default admin to get a JWT token.

**POST** `http://localhost:5001/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "mobile_number": "9999999999",
    "password": "admin123"
  }
  ```
- **Response:** You will receive a `token`. Copy this string! 
- **Setup:** For all the requests below, go to the **Authorization** tab in Postman, select **Bearer Token**, and paste your token.

---

## 2. Managing Accountants (Admin only)

**GET** `http://localhost:5001/api/users`
- Lists all accountants/staff.

**POST** `http://localhost:5001/api/users`
- **Body (JSON):**
  ```json
  {
    "name": "Ramesh (Milk Entry)",
    "mobile_number": "8888888888",
    "password": "password123",
    "role": "milk-entry"
  }
  ```

---

## 3. Managing Samitis (Admin only)

**POST** `http://localhost:5001/api/samitis`
- **Body (JSON):**
  ```json
  {
    "name": "Village A Samiti"
  }
  ```
- Make note of the generated `id` (e.g., `1`).

**GET** `http://localhost:5001/api/samitis`
- Lists all samitis and their 4-digit codes.

---

## 4. Vehicle Assignment (Admin only)

**POST** `http://localhost:5001/api/vehicles`
- **Body (JSON):**
  ```json
  {
    "vehicle_number": "RJ-14-XY-1234",
    "samiti_id": 1
  }
  ```

**GET** `http://localhost:5001/api/vehicles`
- View mappings.

---

## 5. Milk Entry (Requires `milk-entry` or `admin` role)

If you created a milk-entry user in step 2, login with that user's credentials and use their token. Otherwise, use your admin token.

**GET** `http://localhost:5001/api/vehicles/search/RJ-14-XY-1234`
- Simulates the vehicle search to get the `samiti_id`.

**POST** `http://localhost:5001/api/milk-entries`
- **Body (JSON):**
  ```json
  {
    "samiti_id": 1,
    "shift": "morning",
    "entry_date": "2026-03-31",
    "milk_quantity_liters": 50.5
  }
  ```
- Check `GET /api/milk-entries/today` to view it.

---

## 6. FAT/SNF Entry (Requires `fat-snf` or `admin` role)

**GET** `http://localhost:5001/api/fat-snf/pending`
- Shows all milk entries that don't have FAT/SNF attached yet. Find your `milk_entry_id` (e.g., `1`).

**POST** `http://localhost:5001/api/fat-snf`
- **Body (JSON):**
  ```json
  {
    "milk_entry_id": 1,
    "fat_value": 6.5,
    "snf_value": 8.5,
    "rate_per_liter": 45.0
  }
  ```
- The backend automatically calculates `total_amount = milk_quantity * rate`.

---

## 7. Reports (Admin only)

**GET** `http://localhost:5001/api/reports/daily?date=2026-03-31`
- View total milk, avg fat, avg snf, and amount per samiti for the date.

**GET** `http://localhost:5001/api/reports/bill?samiti_id=1&from_date=2026-03-21&to_date=2026-03-31`
- Get a chronological 10-day breakdown for a specific samiti.
