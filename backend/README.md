# DeployPulse — Node.js Backend

Express + MySQL REST API for the DeployPulse deployment tracker.

## Project Structure

```
backend/
├── config/
│   └── db.js              # MySQL connection pool (mysql2/promise)
├── middleware/
│   ├── auth.js            # JWT authenticate + authorize(role) guards
│   └── errorHandler.js    # Validation check + global error handler
├── routes/
│   ├── auth.js            # POST /login, GET /me, POST /change-password
│   ├── deployments.js     # Full CRUD + trigger + log append
│   ├── stats.js           # Dashboard stats + history chart + env health
│   ├── environments.js    # GET / POST environments
│   └── services.js        # GET / POST / DELETE services
├── scripts/
│   ├── migrate.js         # Creates all MySQL tables
│   └── seed.js            # Inserts demo users, services, deployments
├── server.js              # Express app, CORS, rate-limiting, routes
├── Dockerfile
├── docker-compose.yml     # Full stack: frontend + backend + MySQL
├── .env.example
└── package.json
```

## Quick Start (local)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DB_PASS and JWT_SECRET at minimum
```

### 3. Start MySQL locally
```bash
# Option A: Docker
docker run -d --name mysql-local \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=deploypulse \
  -e MYSQL_USER=deploypulse_user \
  -e MYSQL_PASSWORD=yourStrongPassword123 \
  -p 3306:3306 mysql:8.0

# Option B: local MySQL install — just create the DB
mysql -u root -p -e "CREATE DATABASE deploypulse;"
```

### 4. Run migrations & seed
```bash
npm run db:migrate   # creates tables
npm run db:seed      # inserts demo data
```

### 5. Start the server
```bash
npm run dev          # nodemon (hot-reload)
# or
npm start            # production
```

Server runs at **http://localhost:5000**

---

## API Reference

### Auth
| Method | Path                        | Auth | Body                        |
|--------|-----------------------------|------|-----------------------------|
| POST   | /api/auth/login             | ✗    | email, password             |
| GET    | /api/auth/me                | ✓    | —                           |
| POST   | /api/auth/change-password   | ✓    | currentPassword, newPassword|

**Login response:**
```json
{
  "token": "eyJ...",
  "user": { "id": 1, "name": "Arjun Mehta", "email": "...", "role": "admin", "avatar": "AM" }
}
```

### Deployments
| Method | Path                              | Role   | Description          |
|--------|-----------------------------------|--------|----------------------|
| GET    | /api/deployments                  | any    | List (paginated)     |
| GET    | /api/deployments/:id              | any    | Single + logs        |
| POST   | /api/deployments                  | any    | Create               |
| PUT    | /api/deployments/:id              | dev+   | Update status        |
| POST   | /api/deployments/:id/trigger      | dev+   | Re-trigger           |
| POST   | /api/deployments/:id/logs         | any    | Append log line      |

**Query params for GET /api/deployments:**
- `status` — filter by status
- `environment` — filter by environment name
- `service` — search by service name
- `limit` / `offset` — pagination (default 50)

### Stats
| Method | Path                   | Description          |
|--------|------------------------|----------------------|
| GET    | /api/stats/dashboard   | Summary cards        |
| GET    | /api/stats/history     | Chart data (?days=7) |
| GET    | /api/stats/environments| Environment health   |

### Environments & Services
| Method | Path                   | Role  |
|--------|------------------------|-------|
| GET    | /api/environments      | any   |
| POST   | /api/environments      | admin |
| GET    | /api/services          | any   |
| POST   | /api/services          | admin |
| DELETE | /api/services/:id      | admin |

---

## Docker (full stack)

```bash
# From the project root (contains frontend/ and backend/)
docker-compose up --build

# First run — migrate and seed the DB
docker exec deploypulse-backend node scripts/migrate.js
docker exec deploypulse-backend node scripts/seed.js
```

Then open http://localhost:3000 — login with `admin@deploypulse.io` / `password`

---

## Demo Credentials (after seed)
| Email                    | Password | Role      |
|--------------------------|----------|-----------|
| admin@deploypulse.io     | password | admin     |
| priya@deploypulse.io     | password | developer |
| rahul@deploypulse.io     | password | developer |
| neha@deploypulse.io      | password | viewer    |
