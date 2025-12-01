# Support Ticket Manager

A support ticket management system that handles heavy operations (like bulk deletes) in the background while keeping the UI responsive. Real-time updates show job progress as it happens.

## Quick Start

### Prerequisites
- Docker Desktop installed (includes Docker and Docker Compose)
- Docker Compose V2 (included with Docker Desktop)

### Quick Start

**First time setup:**
```bash
# 1. Clone and setup
git clone <your-repo-url>
cd Ticket
cp .env.example .env

# 2. Update JWT_SECRET in .env (generate with: openssl rand -base64 32)

# 3. Run the management script (builds, starts services, and seeds)
./manage.sh
```

**After initial setup:**
```bash
./manage.sh
```

**Or use Docker Compose commands directly:**
```bash
docker compose build
docker compose up -d
docker compose exec api npm run seed
```

**Note:** This project uses Docker Compose V2 syntax (`docker compose` with space). If you're using V1, replace with `docker-compose` (with hyphen).

**Other useful commands:**
```bash
./manage.sh logs        # View logs
./manage.sh logs api    # View API logs only
./manage.sh seed        # Seed database
./manage.sh reset       # Reset database
./manage.sh down        # Stop services
./manage.sh clean       # Clean everything (with confirmation)
./manage.sh status      # Check service status
./manage.sh help        # Show all commands
```

**Note:** Migrations run automatically when the API container starts (configured in `docker-compose.yml`). The migration files are in `api/src/migrations/` and are executed via `npm run db:migrate` on container startup.

**Access the app:**
- Frontend: http://localhost:3000
- API: http://localhost:3001

## Architecture

The app has three main parts:

1. **API Server** - Handles HTTP requests and Socket.io connections
2. **Worker Process** - Processes background jobs (separate from the API)
3. **Web Frontend** - The React UI

**How it works:**
- When you request a bulk delete, the API creates a job and queues it
- Returns immediately (under 1 second)
- Worker picks up the job and processes tickets in chunks
- Progress updates are sent via Socket.io
- UI updates in real-time without refreshing

**Tech Stack:**
- Backend: Node.js + Express (TypeScript)
- Frontend: Next.js + React (TypeScript) + Ant Design
- Database: PostgreSQL with Sequelize
- Queue: Redis + BullMQ
- Real-time: Socket.io

## API Endpoints

### Jobs

**POST `/api/jobs`** - Create bulk delete job (admin only)
```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: optional-key" \
  -d '{
    "type": "bulk-delete",
    "payload": {
      "ticketIds": ["uuid1", "uuid2"]
    }
  }'
```

**GET `/api/jobs/:id`** - Get job details with item-level results

**GET `/api/jobs`** - List jobs (optional: `?type=bulk-delete&status=completed`)

**POST `/api/jobs/:id/cancel`** - Cancel running job (admin only)

### Tickets

**GET `/api/tickets`** - List tickets (`?page=1&limit=20`)

**GET `/api/tickets/:id`** - Get single ticket

**POST `/api/tickets`** - Create ticket

**PUT `/api/tickets/:id`** - Update ticket

**DELETE `/api/tickets/:id`** - Delete ticket

See `postman_collection.json` for a complete Postman collection with all endpoints.

## Socket Events

The app emits these events over Socket.io:

- `jobs:created` - New job created
- `jobs:progress` - Progress update (includes progress %, succeeded, failed counts)
- `jobs:completed` - Job finished successfully
- `jobs:failed` - Job failed
- `jobs:canceled` - Job was canceled

**Example client connection:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');
socket.emit('join:user', 'your-user-id');

socket.on('jobs:progress', (data) => {
  console.log(`Progress: ${data.progress}%`);
});
```

## Development

### Running Locally

1. **Start database and Redis:**
   ```bash
   docker compose up -d postgres redis
   ```

2. **API:**
   ```bash
   cd api
   npm install
   npm run db:migrate
   npm run seed
   npm run dev
   ```

3. **Worker** (separate terminal):
   ```bash
   cd api
   npm run dev:worker
   ```

4. **Web:**
   ```bash
   cd web
   npm install
   npm run dev
   ```

### Database Commands

**Note:** Migrations run automatically on container startup. You only need these commands if you want to run them manually:

```bash
# Run migrations manually (usually not needed - runs automatically)
docker compose exec api npm run db:migrate

# Seed data
docker compose exec api npm run seed

# Reset database (drops all tables, re-runs migrations, seeds)
docker compose exec api npm run db:reset
```

**Migration files location:** `api/src/migrations/`

## Environment Variables

**Root `.env` (for Docker):**
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secret_here

DB_HOST=postgres
DB_PORT=5432
DB_NAME=ticket_db
DB_USER=ticket_user
DB_PASSWORD=ticket_password

REDIS_URL=redis://redis:6379
```

## Troubleshooting

**Port already in use?**
Change ports in `.env` (PORT, WEB_PORT, DB_PORT, REDIS_PORT)

**Database connection errors?**
```bash
docker compose ps
docker compose logs postgres
```

**Worker not processing jobs?**
```bash
docker compose logs worker
```

**Socket connection issues?**
Make sure `FRONTEND_URL` in `.env` matches where your frontend is running.

## Project Structure

```
Ticket/
├── api/                 # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── workers/     # BullMQ workers
│   │   ├── sockets/     # Socket.io handlers
│   │   └── migrations/ # DB migrations
│   └── Dockerfile
├── web/                 # Frontend (Next.js + React)
│   ├── src/
│   │   ├── app/         # Pages
│   │   ├── components/  # React components
│   │   └── hooks/       # Custom hooks
│   └── Dockerfile
└── docker-compose.yml
```

## Features

- ✅ Ticket CRUD with soft delete
- ✅ Bulk delete via background jobs (returns in <1 second)
- ✅ Real-time progress updates via Socket.io
- ✅ Job cancellation
- ✅ Idempotent requests (safe retry)
- ✅ Item-level error tracking
- ✅ Admin-only bulk operations
