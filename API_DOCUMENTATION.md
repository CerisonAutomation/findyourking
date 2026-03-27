# API Documentation - Find Your King

## Overview

This document provides comprehensive API documentation for the Find Your King platform. All endpoints follow RESTful conventions and include proper authentication, validation, and error handling.

## Base URL

```
Production: https://api.findyourking.app
Development: http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication Endpoints

### POST /api/auth/signup

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "johndoe",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2026-03-24T22:00:00Z"
  }
}
```

### POST /api/auth/signin

Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

### POST /api/auth/forgot-password

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST /api/auth/reset-password

Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## Profile Endpoints

### GET /api/profiles

Get list of profiles with filtering.

**Query Parameters:**
- `query` (string): Search by username or bio
- `min_age` (number): Minimum age filter
- `max_age` (number): Maximum age filter
- `max_distance` (number): Maximum distance in km
- `interests` (string): Comma-separated interests
- `verified_only` (boolean): Only verified profiles
- `online_only` (boolean): Only online users
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 50)

**Response:**
```json
{
  "profiles": [
    {
      "id": "uuid",
      "userId": "uuid",
      "displayName": "Jane Smith",
      "bio": "Love hiking and photography",
      "avatarUrl": "https://...",
      "age": 28,
      "gender": "female",
      "location": "New York, NY",
      "interests": ["hiking", "photography", "travel"],
      "verified": true,
      "lastActive": "2026-03-24T22:00:00Z",
      "isPremium": false
    }
  ],
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

### GET /api/profiles/:id

Get specific profile by ID.

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "userId": "uuid",
    "displayName": "Jane Smith",
    "bio": "Love hiking and photography",
    "avatarUrl": "https://...",
    "age": 28,
    "gender": "female",
    "location": "New York, NY",
    "interests": ["hiking", "photography", "travel"],
    "verified": true,
    "lastActive": "2026-03-24T22:00:00Z",
    "isPremium": false
  }
}
```

### PATCH /api/profiles

Update current user's profile.

**Request Body:**
```json
{
  "displayName": "Jane Doe",
  "bio": "Updated bio",
  "avatarUrl": "https://...",
  "interests": ["hiking", "photography", "travel", "cooking"]
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "displayName": "Jane Doe",
    "bio": "Updated bio",
    "updatedAt": "2026-03-24T22:00:00Z"
  }
}
```

---

## Swipe Endpoints

### POST /api/swipes

Record a swipe action.

**Request Body:**
```json
{
  "target_id": "user_uuid",
  "direction": "like"
}
```

**Directions:**
- `like`: Swipe right (like)
- `pass`: Swipe left (pass)
- `super_like`: Super like

**Response:**
```json
{
  "success": true,
  "match": {
    "id": "uuid",
    "userId": "uuid",
    "targetUserId": "uuid",
    "direction": "right",
    "isMatch": true,
    "matchedAt": "2026-03-24T22:00:00Z"
  },
  "conversation": {
    "id": "uuid",
    "participantAId": "uuid",
    "participantBId": "uuid",
    "isActive": true
  },
  "message": "It's a match!"
}
```

### GET /api/swipes

Get user's swipe history.

**Query Parameters:**
- `type` (string): Filter by type (`all`, `matches`, `sent`)

**Response:**
```json
{
  "matches": [
    {
      "id": "uuid",
      "userId": "uuid",
      "targetUserId": "uuid",
      "direction": "right",
      "isMatch": true,
      "matchedAt": "2026-03-24T22:00:00Z",
      "targetUser": {
        "id": "uuid",
        "username": "janesmith",
        "displayName": "Jane Smith",
        "avatarUrl": "https://..."
      }
    }
  ]
}
```

---

## Events Endpoints

### GET /api/events

Get list of events with filtering.

**Query Parameters:**
- `category` (string): Filter by category
- `search` (string): Search by title or description
- `startDate` (string): Filter by start date
- `endDate` (string): Filter by end date
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 100)

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Singles Mixer Night",
      "description": "Join us for a fun evening of mingling",
      "category": "social",
      "location": {
        "name": "The Grand Hotel",
        "address": "123 Main St, New York, NY",
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "startDate": "2026-04-01T19:00:00Z",
      "endDate": "2026-04-01T23:00:00Z",
      "capacity": 50,
      "currentAttendees": 35,
      "price": 25.00,
      "imageUrl": "https://...",
      "isPublic": true,
      "tags": ["singles", "mixer", "social"],
      "organizer": {
        "id": "uuid",
        "username": "eventhost"
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

### POST /api/events

Create a new event.

**Request Body:**
```json
{
  "title": "Singles Mixer Night",
  "description": "Join us for a fun evening of mingling",
  "category": "social",
  "location": {
    "name": "The Grand Hotel",
    "address": "123 Main St, New York, NY",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "startDate": "2026-04-01T19:00:00Z",
  "endDate": "2026-04-01T23:00:00Z",
  "capacity": 50,
  "price": 25.00,
  "imageUrl": "https://...",
  "isPublic": true,
  "tags": ["singles", "mixer", "social"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Singles Mixer Night",
  "description": "Join us for a fun evening of mingling",
  "category": "social",
  "organizerId": "uuid",
  "createdAt": "2026-03-24T22:00:00Z"
}
```

### GET /api/events/:id

Get specific event by ID.

**Response:**
```json
{
  "event": {
    "id": "uuid",
    "title": "Singles Mixer Night",
    "description": "Join us for a fun evening of mingling",
    "category": "social",
    "location": {
      "name": "The Grand Hotel",
      "address": "123 Main St, New York, NY",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "startDate": "2026-04-01T19:00:00Z",
    "endDate": "2026-04-01T23:00:00Z",
    "capacity": 50,
    "currentAttendees": 35,
    "price": 25.00,
    "imageUrl": "https://...",
    "isPublic": true,
    "tags": ["singles", "mixer", "social"],
    "organizer": {
      "id": "uuid",
      "username": "eventhost",
      "displayName": "Event Host"
    }
  }
}
```

---

## Messages Endpoints

### GET /api/messages

Get messages for a conversation.

**Query Parameters:**
- `conversationId` (string): Conversation ID
- `page` (number): Page number (default: 1)
- `limit` (number): Messages per page (default: 50)

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "content": "Hey, how are you?",
      "type": "text",
      "createdAt": "2026-03-24T22:00:00Z",
      "readAt": "2026-03-24T22:05:00Z"
    }
  ],
  "conversation": {
    "id": "uuid",
    "participantAId": "uuid",
    "participantBId": "uuid",
    "isActive": true
  }
}
```

### POST /api/messages

Send a new message.

**Request Body:**
```json
{
  "conversationId": "uuid",
  "content": "Hey, how are you?",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderId": "uuid",
    "content": "Hey, how are you?",
    "type": "text",
    "createdAt": "2026-03-24T22:00:00Z"
  }
}
```

---

## Health Check

### GET /api/health

Check application health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-24T22:00:00Z",
  "version": "2.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "ai": "healthy"
  }
}
```

---

## WebSocket Events

### Connection

```javascript
const socket = new WebSocket('wss://api.findyourking.app/ws');
```

### Events

#### `message`
New message received.

```json
{
  "type": "message",
  "data": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderId": "uuid",
    "content": "Hey, how are you?",
    "type": "text",
    "createdAt": "2026-03-24T22:00:00Z"
  }
}
```

#### `match`
New match notification.

```json
{
  "type": "match",
  "data": {
    "matchId": "uuid",
    "userId": "uuid",
    "matchedAt": "2026-03-24T22:00:00Z"
  }
}
```

#### `typing`
User typing indicator.

```json
{
  "type": "typing",
  "data": {
    "conversationId": "uuid",
    "userId": "uuid",
    "isTyping": true
  }
}
```

#### `presence`
User online/offline status.

```json
{
  "type": "presence",
  "data": {
    "userId": "uuid",
    "status": "online",
    "lastSeen": "2026-03-24T22:00:00Z"
  }
}
```

---

## SDKs & Libraries

### JavaScript/TypeScript

```bash
npm install @findyourking/sdk
```

```typescript
import { FindYourKingClient } from '@findyourking/sdk';

const client = new FindYourKingClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.findyourking.app'
});

// Get profiles
const profiles = await client.profiles.search({
  minAge: 25,
  maxAge: 35,
  interests: ['hiking', 'travel']
});

// Record swipe
const result = await client.swipes.create({
  targetId: 'user_uuid',
  direction: 'like'
});
```

### Python

```bash
pip install findyourking
```

```python
from findyourking import FindYourKingClient

client = FindYourKingClient(api_key='your_api_key')

# Get profiles
profiles = client.profiles.search(min_age=25, max_age=35)

# Record swipe
result = client.swipes.create(target_id='user_uuid', direction='like')
```

---

## Support

For API support:
- **Documentation**: https://docs.findyourking.app/api
- **Email**: api-support@findyourking.app
- **Status Page**: https://status.findyourking.app