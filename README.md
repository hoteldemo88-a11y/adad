# Child Monitor - Parental Control & Monitoring Platform

A production-ready parental control system for monitoring a child's device by their parent or legal guardian with informed consent. The system complies with Android permissions and applicable privacy laws.

## Architecture Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Android App    │────▶│   Backend API    │◀────│  Web Dashboard   │
│  (Child Device)  │     │  (Node/Fastify)  │     │   (React/Vite)   │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                         ┌────────┴─────────┐
                         │                  │
                    ┌────▼────┐      ┌──────▼─────┐
                    │PostgreSQL│      │   Redis    │
                    └─────────┘      └────────────┘
```

### How It Works

1. **Parent** logs into the web dashboard and generates a 6-digit pairing code
2. **Child's device** installs the Android app
3. App requests permissions (contacts, call log, SMS) with clear explanations
4. Parent enters the pairing code to link the device
5. Monitoring starts **automatically** - no further action needed
6. Data syncs every 15 minutes via WorkManager background service
7. Parent views data in real-time on the web dashboard

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Android** | Kotlin, Jetpack Compose, Hilt, Room, WorkManager, Retrofit, DataStore |
| **Backend** | Node.js, Fastify, Prisma ORM, PostgreSQL, Redis, JWT |
| **Dashboard** | React, Vite, TypeScript, Tailwind CSS, TanStack Query, Chart.js |
| **Infrastructure** | Docker, Docker Compose, Nginx, GitHub Actions CI/CD |

## Project Structure

```
monitoring system/
├── backend/                    # Node.js Fastify backend
│   ├── prisma/                 # Prisma schema and migrations
│   ├── src/
│   │   ├── config/             # Environment and database config
│   │   ├── middleware/          # Auth, error handling, rate limiting
│   │   ├── routes/             # API route handlers
│   │   ├── utils/              # Validators, crypto, helpers
│   │   └── index.ts            # Server entry point
│   ├── tests/                  # Integration tests
│   └── Dockerfile
├── dashboard/                  # React web dashboard
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # Auth and theme contexts
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # API client, auth helpers
│   │   ├── pages/              # Page components
│   │   └── types/              # TypeScript interfaces
│   └── Dockerfile
├── android/                    # Android app
│   └── app/src/main/java/com/childmonitor/app/
│       ├── data/               # Room DB, Retrofit API, repositories
│       ├── di/                 # Hilt dependency injection
│       ├── service/            # WorkManager sync, foreground service
│       ├── ui/                 # Compose screens, navigation, theme
│       └── util/               # Permission, contact/call/SMS readers
├── nginx/                      # Reverse proxy configuration
├── scripts/                    # Setup, deploy, seed scripts
├── docker-compose.yml          # Production Docker Compose
├── docker-compose.dev.yml      # Development Docker Compose
└── .github/workflows/ci.yml    # CI/CD pipeline
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Android Studio (for Android development)

### Production Setup (Docker)

```bash
# 1. Clone the repository
git clone <repository-url>
cd "monitoring system"

# 2. Copy environment template
cp .env.example .env

# 3. Generate secrets and edit .env
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for JWT_REFRESH_SECRET

# 4. Start all services
docker compose up -d

# 5. Run database migrations
docker compose exec backend npx prisma migrate deploy

# 6. Seed the database (optional)
docker compose exec backend npx tsx scripts/seed.ts
```

### Development Setup

```bash
# Start only database services
docker compose -f docker-compose.dev.yml up -d postgres redis

# Backend
cd backend
cp ../.env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Dashboard (separate terminal)
cd dashboard
npm install
npm run dev

# Android (in Android Studio)
# Open android/ folder and run on emulator/device
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_USER` | Database username | Yes |
| `POSTGRES_PASSWORD` | Database password | Yes |
| `POSTGRES_DB` | Database name | Yes |
| `REDIS_PASSWORD` | Redis password | Yes |
| `JWT_SECRET` | Access token secret (64 hex chars) | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `SMTP_HOST` | Email server host | For password reset |
| `SMTP_USER` | Email server user | For password reset |
| `SMTP_PASS` | Email server password | For password reset |

## Android App Flow

The app follows a simple flow with no login required:

```
Install → Splash → Permissions → Pairing Code → Auto-Sync Starts
```

### Permissions Requested

| Permission | Purpose | Required |
|-----------|---------|----------|
| `READ_CONTACTS` | Monitor contacts for safety | Yes |
| `READ_CALL_LOG` | Track call history | Yes |
| `READ_SMS` | Detect concerning messages | Yes |
| `POST_NOTIFICATIONS` | Background service notification | Recommended |

### Background Sync

- **WorkManager** runs periodic sync every 15 minutes
- **Exponential backoff** retries on failure
- **Offline queue** stores data locally, syncs when connected
- **Incremental sync** uses sync hashes to prevent duplicates
- **Auto-resume** after reboot, app update, or network reconnect
- **Foreground notification** required by Android for background operation

## API Endpoints

### Authentication (Parent Dashboard)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create parent account |
| POST | `/api/auth/login` | Parent login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset with token |

### Device Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/devices/register` | Register device (generates pairing code) |
| POST | `/api/devices/pair` | Pair device with pairing code (Android) |
| GET | `/api/devices` | List parent's devices |
| DELETE | `/api/devices/:id` | Remove device and data |
| POST | `/api/devices/:id/pause` | Pause monitoring |
| POST | `/api/devices/:id/resume` | Resume monitoring |

### Data Sync (Android App)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contacts/sync` | Sync contacts (incremental) |
| GET | `/api/contacts` | List contacts (Dashboard) |
| POST | `/api/calls/sync` | Sync call logs |
| GET | `/api/calls` | List call logs (Dashboard) |
| POST | `/api/sms/sync` | Sync SMS messages |
| GET | `/api/sms` | List SMS (Dashboard) |

### Dashboard & Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Aggregated dashboard data |
| GET | `/api/notifications` | List notifications |
| PUT | `/api/notifications/:id/read` | Mark notification read |
| PUT | `/api/notifications/read-all` | Mark all read |

## Database Schema

### Entity Relationship

```
Parent ──1:N──▶ ChildDevice ──1:N──▶ Contact
                                  ──1:N──▶ CallLog
                                  ──1:N──▶ SmsMessage

Parent ──1:N──▶ RefreshToken
Parent ──1:N──▶ Notification
Parent ──1:N──▶ Session
Parent ──1:N──▶ AuditLog
ChildDevice ──1:N──▶ SyncState
```

### Key Tables

- **Parent**: User accounts for the dashboard
- **ChildDevice**: Registered child devices with pairing codes
- **Contact**: Synced contacts with incremental hash
- **CallLog**: Call history with type, duration, timestamp
- **SmsMessage**: SMS messages with sender/recipient
- **Notification**: Push notifications for parent
- **SyncState**: Tracks incremental sync per entity type
- **AuditLog**: Security audit trail

## Security Features

- **JWT Authentication** with short-lived access tokens (15min) and refresh tokens (7d)
- **Password Hashing** with bcrypt (12 rounds)
- **Rate Limiting** on all endpoints (100 req/15min)
- **Input Validation** using Zod schemas
- **SQL Injection Protection** via Prisma ORM parameterized queries
- **HTTPS Only** enforced in production
- **CORS** restricted to allowed origins
- **Helmet** security headers
- **Encrypted sensitive data** at rest
- **Audit Logging** for all sensitive operations
- **Incremental sync** with hash-based deduplication

## Dashboard Features

- **Real-time Device Status**: Battery, storage, connectivity, last sync
- **Activity Charts**: Call distribution, message volume, screen time
- **Contact Management**: Search, filter, favorites, CSV export
- **Call Logs**: Filter by type (incoming/outgoing/missed), date range, CSV export
- **SMS Viewer**: Search, filter by type, date range
- **Notification Center**: Low battery, offline, permission revoked alerts
- **Settings**: Sync interval, device pairing, profile management
- **Dark/Light Mode**: Toggle with system preference detection
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Keyboard Shortcuts**: Power-user navigation
- **Loading Skeletons**: Smooth loading states
- **Empty States**: Helpful guidance when no data

## Deployment Guide

### Docker Production Deployment

```bash
# Build and start
docker compose -f docker-compose.yml up -d --build

# Run migrations
docker compose exec backend npx prisma migrate deploy

# View logs
docker compose logs -f backend
```

### Environment Checklist

- [ ] All secrets generated with `openssl rand -hex 32`
- [ ] PostgreSQL password is strong and unique
- [ ] Redis password is set
- [ ] CORS origins configured for your domain
- [ ] SMTP configured for password reset emails
- [ ] SSL certificates configured in nginx
- [ ] Rate limiting values tuned for your traffic

### Production Checklist

- [ ] `NODE_ENV=production`
- [ ] All `.env` secrets are strong and unique
- [ ] Database backups configured
- [ ] SSL/TLS enabled (Let's Encrypt or custom certs)
- [ ] Nginx configured with security headers
- [ ] Rate limiting enabled
- [ ] Logging configured (structured JSON)
- [ ] Error monitoring (Sentry or similar)
- [ ] Health check endpoints working
- [ ] Docker health checks passing
- [ ] Android APK signed with release keystore
- [ ] ProGuard/R8 enabled for Android release builds

## Testing Strategy

### Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests
```

### Dashboard Tests

```bash
cd dashboard
npm test                    # Run all tests
npm run test:coverage       # Coverage report
```

### Android Tests

```bash
# In Android Studio
./gradlew test              # Unit tests
./gradlew connectedAndroidTest  # Instrumentation tests
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

1. **Backend**: Lint, typecheck, unit tests, integration tests
2. **Dashboard**: Lint, build, test
3. **Docker**: Build and push images on `main` branch

## Contributing

1. Create a feature branch from `main`
2. Make changes with tests
3. Run linting and type checking
4. Submit a pull request

## License

This project is for educational and legitimate parental monitoring purposes only. Ensure compliance with local privacy laws before deployment.

## Support

For issues and questions, please open a GitHub issue.
