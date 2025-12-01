# Backend API Documentation

## Overview
Express.js REST API with PostgreSQL database for Employee Travel Portal.

**Base URL:** `http://localhost:5000/api`

---

## Authentication

### POST `/auth/register`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "employee"  // employee | manager | finance | admin
}
```

**Response:**
```json
{
  "success": true,
  "token": "base64_token",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "employee" }
}
```

### POST `/auth/login`
Authenticate user.

**Request Body:**
```json
{ "email": "john@example.com", "password": "password123" }
```

### POST `/auth/logout`
Logout user (invalidate session).

---

## Trips

### GET `/trips`
Get all trips with timeline, comments, and attachments.

**Response:**
```json
{
  "success": true,
  "trips": [{
    "id": 1,
    "destination": "Tokyo",
    "start": "2025-12-01",
    "end": "2025-12-05",
    "status": "pending",
    "requester": "John Doe",
    "requesterEmail": "john@example.com",
    "department": "Engineering",
    "purpose": "Client meeting",
    "costEstimate": 3500,
    "riskLevel": "Medium",
    "timeline": [],
    "comments": [],
    "attachments": []
  }]
}
```

### POST `/trips`
Create new trip request.

**Request Body:**
```json
{
  "destination": "Tokyo",
  "start": "2025-12-01",
  "end": "2025-12-05",
  "requester": "John Doe",
  "requesterEmail": "john@example.com",
  "department": "Engineering",
  "purpose": "Client meeting",
  "costEstimate": 3500,
  "riskLevel": "Low"  // Low | Medium | High
}
```

### PATCH `/trips/:id`
Update trip (status, details).

**Request Body:**
```json
{ "status": "approved" }  // pending | approved | rejected | active | completed
```

### DELETE `/trips/:id`
Delete a trip.

---

## Expenses

### GET `/expenses`
Get all expenses.

**Response:**
```json
{
  "success": true,
  "expenses": [{ "id": 1, "tripId": null, "category": "Airfare", "vendor": "Delta", "amount": 450, "description": "Flight to NYC", "date": "2025-11-24" }],
  "totalExpense": 450
}
```

### POST `/expenses`
Create expense.

**Request Body:**
```json
{
  "tripId": 1,
  "category": "Airfare",
  "vendor": "Delta Airlines",
  "amount": 450,
  "description": "Round trip flight",
  "date": "2025-11-24"
}
```

---

## KPI Dashboard

### GET `/kpi?range=30d`
Get key performance indicators.

**Query Params:** `range` - 7d | 30d | 90d | 1y

**Response:**
```json
{
  "success": true,
  "kpis": {
    "total_airfare": 900,
    "total_hotels": 500,
    "total_cars": 200,
    "total_spend": 1600,
    "trips_count": 5,
    "distinct_travelers": 3,
    "destinations_count": 4,
    "avg_booking_lead_days": 7,
    "flights_count": 10,
    "hotels_count": 5,
    "cars_count": 3
  }
}
```

---

## Policies

### GET `/policy`
Get all policies.

### POST `/policy`
Create policy.

**Request Body:**
```json
{
  "title": "Travel Policy",
  "category": "travel",
  "status": "Active",
  "content": "Policy content here..."
}
```

---

## Documents

### GET `/documents`
Get all documents.

### POST `/documents`
Upload document (multipart/form-data).

**Form Fields:** `file`, `tripId`, `category`, `description`

---

## Risk Management

### GET `/risk/advisories`
Get travel advisories.

### POST `/risk/advisories`
Create advisory.

### GET `/risk/travelers`
Get travelers with safety status.

### POST `/risk/travelers/:id/checkin`
Traveler check-in.

### POST `/risk/travelers/:id/sos`
Trigger SOS alert.

---

## Analytics

### GET `/analytics`
Get analytics data (trips, expenses, incidents).

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error
