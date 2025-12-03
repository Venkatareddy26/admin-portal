# API Reference Guide

Complete API documentation for all endpoints.

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require an Authorization header:
```
Authorization: Bearer {token}
```

---

## Authentication Endpoints

### POST /api/auth/login

Login and receive authentication token.

**Endpoint:** `/api/auth/login`  
**Method:** POST  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "john@11"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "MToyMDI1LTExLTI0VDA2OjI0OjQyLjIyNlo=",
  "user": {
    "id": 1,
    "name": "john",
    "email": "john@example.com",
    "role": "manager",
    "avatar": null
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### POST /api/auth/register

Register a new user account.

**Endpoint:** `/api/auth/register`  
**Method:** POST  
**Authentication:** Not required

**Request Body:**
```json
{
  "name": "John Doe",
  "ema