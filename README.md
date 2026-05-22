# Smart Job Portal — Backend

Production-grade REST API for the Smart Job Portal. Built with **TypeScript**, **Node.js**, **Express**, **MongoDB** (Mongoose), and **Elasticsearch** (planned).

## Tech stack

- TypeScript 5
- Node.js 18+ (ES modules)
- Express 4
- MongoDB + Mongoose
- JWT authentication utilities
- ESLint (Airbnb TypeScript) + Prettier
- Husky + lint-staged
- Docker Compose (MongoDB, Elasticsearch, Kibana)

## Prerequisites

- Node.js >= 18
- npm or yarn
- Docker & Docker Compose (for local infrastructure)

## Quick start

### 1. Start infrastructure

```bash
docker compose up -d
```

Services:

| Service       | URL                         |
| ------------- | --------------------------- |
| MongoDB       | `mongodb://localhost:27017` |
| Elasticsearch | `http://localhost:9200`     |
| Kibana        | `http://localhost:5601`     |

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values (especially `JWT_SECRET`).

### 3. Install & run

```bash
npm install
npm run dev
```

API runs at **http://localhost:5000**

## Scripts

| Script           | Description                       |
| ---------------- | --------------------------------- |
| `npm run dev`    | Start dev server with tsx (watch) |
| `npm run build`  | Compile TypeScript to `dist/`     |
| `npm start`      | Run compiled production server    |
| `npm run lint`   | Run ESLint                        |
| `npm run format` | Format code with Prettier         |

## API endpoints

| Method | Path      | Description               |
| ------ | --------- | ------------------------- |
| GET    | `/`       | API info                  |
| GET    | `/health` | Server uptime & DB status |

### Health response example

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": { "seconds": 120, "human": "120s" },
    "database": { "status": "connected", "connected": true },
    "timestamp": "2026-05-22T08:00:00.000Z"
  }
}
```

## Project structure

```
backend-smart-job-portal/
├── server.ts                 # Entry point — DB connect & listen
├── tsconfig.json
├── docker-compose.yml
├── src/
│   ├── app.ts                # Express app setup
│   ├── types/                # Shared TypeScript types
│   ├── config/               # env, database
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   ├── workers/
│   ├── utils/
│   ├── elastic/
│   └── validations/
```

## Error response format

```json
{
  "success": false,
  "message": "Error description",
  "stack": "..."
}
```

`stack` is included only in `development` mode.

## License

MIT
