# 🎫 BookIt — Live Event Booking Platform

A full-stack event booking platform built with React, Node.js, Express, PostgreSQL, and Prisma. Features concurrent-safe seat booking, role-based access control, and a complete organizer dashboard with analytics.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Recharts, Axios |
| Backend | Node.js 20, Express 4, Prisma 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Containerization | Docker Compose |

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start everything
git clone <repo-url> && cd bookit
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Database**: localhost:5432

### Option 2: Local Development

**Prerequisites**: Node.js 20+, PostgreSQL 16+

```bash
# 1. Start PostgreSQL and create database
createdb bookit_db

# 2. Server setup
cd server
cp .env.example .env  # Edit DATABASE_URL if needed
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev

# 3. Client setup (new terminal)
cd client
npm install
npm run dev
```

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Organizer | organizer@bookit.com | password123 |
| Organizer | organizer2@bookit.com | password123 |
| User | user1@bookit.com | password123 |
| User | user2@bookit.com | password123 |

## Features

### Users
- ✅ Signup/Login with role selection (User or Organizer)
- ✅ Browse events with search, date filter, and pagination
- ✅ View event details with seat availability
- ✅ Book events (concurrent-safe, no overselling)
- ✅ View and cancel bookings

### Organizers
- ✅ Create and edit events
- ✅ View attendee list per event
- ✅ Dashboard with stats (events, bookings, revenue, conversion rate)
- ✅ Analytics with charts (bookings over time, top events)
- ✅ Activity logs with action filtering

### Technical
- ✅ JWT authentication with protected routes
- ✅ Role-based authorization
- ✅ Pessimistic locking (`SELECT ... FOR UPDATE`) for concurrent bookings
- ✅ PostgreSQL with Prisma ORM
- ✅ Database migrations and seed data
- ✅ Docker Compose (3-service setup)
- ✅ Concurrency test script
- ✅ Activity logging (views, booking attempts, confirmations, cancellations)

## Concurrency Handling

The critical requirement: **two users booking the last seat simultaneously must result in exactly one success and one failure**.

### Solution: Pessimistic Locking

```
User A → BEGIN TRANSACTION
       → SELECT ... FOR UPDATE (locks the event row)
       → Reads available_seats = 1 → OK
       → Decrements to 0 → Creates booking
       → COMMIT (releases lock)

User B → BEGIN TRANSACTION
       → SELECT ... FOR UPDATE (BLOCKS until User A commits)
       → Reads available_seats = 0 → REJECTED
       → ROLLBACK
```

### Run the Concurrency Test

```bash
# Start the server first, then:
cd server
node scripts/test-concurrency.js
```

Expected output:
```
🎉 TEST PASSED! Concurrency handling is correct.
   - Exactly 1 booking succeeded
   - Exactly 1 booking was rejected
   - No overselling occurred
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user (requires auth) |

### Events
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | List events (search, filter, paginate) |
| GET | `/api/events/:id` | Get event details |
| GET | `/api/events/mine` | Organizer's events (auth + ORGANIZER) |
| POST | `/api/events` | Create event (auth + ORGANIZER) |
| PUT | `/api/events/:id` | Update event (auth + ORGANIZER + owner) |

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bookings` | Book an event (auth + USER) |
| GET | `/api/bookings` | Get user's bookings (auth) |
| PATCH | `/api/bookings/:id/cancel` | Cancel a booking (auth + owner) |

### Dashboard (Organizer only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Overall stats |
| GET | `/api/dashboard/analytics` | Analytics data with charts |
| GET | `/api/dashboard/activity-logs` | Activity logs |
| GET | `/api/dashboard/events/:id/attendees` | Event attendees |

## Project Structure

```
bookit/
├── client/                   # React frontend (Vite)
│   └── src/
│       ├── api/              # Axios instance with JWT interceptors
│       ├── components/       # Reusable UI components
│       ├── contexts/         # Auth context (global state)
│       ├── hooks/            # Custom hooks (useAuth, useFetch, useDebounce)
│       ├── pages/            # Page components
│       └── utils/            # Constants, formatters
├── server/                   # Express backend
│   ├── prisma/               # Schema, migrations, seed
│   ├── scripts/              # Concurrency test
│   └── src/
│       ├── config/           # Environment variables
│       ├── controllers/      # Request handlers (thin layer)
│       ├── middleware/       # Auth, validation, error handling
│       ├── routes/           # Route definitions
│       ├── services/         # Business logic + DB transactions
│       ├── utils/            # Prisma client, ApiError, logger
│       └── validators/       # express-validator chains
├── docker-compose.yml
└── README.md
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://bookit:bookit123@localhost:5432/bookit_db` | PostgreSQL connection |
| `JWT_SECRET` | `supersecretkey-change-in-production` | JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | Token lifetime |
| `PORT` | `3001` | Server port |
| `VITE_API_URL` | `http://localhost:3001/api` | API URL for frontend |

## Database Reset

```bash
cd server
npx prisma migrate reset --force  # Drops all data, re-runs migrations + seed
```
