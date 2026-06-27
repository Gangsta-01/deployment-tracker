# DeployPulse — Deployment Tracker Frontend

A React-based deployment tracking dashboard with login, live status indicators,
environment health, deployment history charts, and a filterable deployments table.

## Project Structure

```
deployment-tracker/
├── public/
│   └── index.html
├── src/
│   ├── context/
│   │   └── AuthContext.js       # Login state, JWT token management
│   ├── services/
│   │   └── api.js               # All Axios API calls → Node backend
│   ├── data/
│   │   └── mockData.js          # Mock data (works without backend)
│   ├── components/
│   │   ├── Sidebar.js / .css    # Navigation sidebar
│   │   └── StatusBadge.js / .css
│   ├── pages/
│   │   ├── Login.js / .css      # Login page
│   │   └── Dashboard.js / .css  # Main dashboard
│   ├── styles/
│   │   ├── global.css           # Design tokens, reset, animations
│   │   └── layout.css
│   ├── App.js                   # Router + layout shell
│   └── index.js
├── Dockerfile                   # Multi-stage build → nginx
├── package.json
└── README.md
```

## Quick Start (local dev)

```bash
npm install
npm start
# Opens at http://localhost:3000
# Demo login: admin@deploypulse.io / password
```

## Backend API Contract

The frontend expects these endpoints on the Node backend (proxy: localhost:5000):

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| POST   | /api/auth/login               | Login → { user, token }  |
| GET    | /api/deployments              | List deployments         |
| GET    | /api/deployments/:id          | Single deployment        |
| POST   | /api/deployments              | Create deployment        |
| POST   | /api/deployments/:id/trigger  | Trigger a deployment     |
| GET    | /api/stats/dashboard          | Dashboard stats          |
| GET    | /api/stats/history?days=7     | Chart history data       |
| GET    | /api/environments             | List environments        |
| GET    | /api/services                 | List services            |

All protected routes expect: `Authorization: Bearer <JWT>`

## Docker Build

```bash
docker build -t deploypulse-frontend .
docker run -p 3000:80 deploypulse-frontend
```

## docker-compose (with backend + MySQL)

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ['3000:80']
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ['5000:5000']
    environment:
      DB_HOST: db
      DB_USER: root
      DB_PASS: secret
      DB_NAME: deploypulse
      JWT_SECRET: your-secret
    depends_on: [db]

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: deploypulse
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

## Jenkins Pipeline (Jenkinsfile skeleton)

```groovy
pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Build Frontend') {
      steps {
        dir('frontend') {
          sh 'docker build -t deploypulse-frontend:${BUILD_NUMBER} .'
        }
      }
    }
    stage('Test') {
      steps {
        dir('frontend') {
          sh 'npm install && npm test -- --watchAll=false'
        }
      }
    }
    stage('Push Image') {
      steps {
        sh 'docker tag deploypulse-frontend:${BUILD_NUMBER} your-registry/deploypulse-frontend:latest'
        sh 'docker push your-registry/deploypulse-frontend:latest'
      }
    }
    stage('Deploy') {
      steps {
        sh 'docker-compose up -d frontend'
      }
    }
  }
}
```

## What to build next

1. **Node backend** — Express + MySQL with the API routes above
2. **Jenkins Jenkinsfile** — full CI/CD pipeline for both services
3. **docker-compose.yml** — wire frontend + backend + MySQL together
