# Acquisitions API

Express + Drizzle ORM API backed by [Neon Postgres](https://neon.tech). Dockerized with two
distinct workflows:

- **Development** — runs against **Neon Local**, a Docker proxy that creates an ephemeral Neon
  branch for you on `docker compose up` and deletes it on `docker compose down`.
- **Production** — runs against your real **Neon Cloud** database, no proxy involved.

## How the DATABASE_URL switch works

The app uses `@neondatabase/serverless` (the HTTP driver) via `drizzle-orm/neon-http`. That
driver normally talks to Neon Cloud's HTTPS data API. Neon Local exposes a local proxy instead,
so [src/config/database.js](src/config/database.js) checks `NODE_ENV` and, only in development,
repoints the driver at the proxy:

```js
if (process.env.NODE_ENV === 'development') {
  const { hostname, port } = new URL(process.env.DATABASE_URL.replace('postgres://', 'http://'));
  neonConfig.fetchEndpoint = `http://${hostname}:${port || 5432}/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}
```

In production this block is skipped entirely and `DATABASE_URL` is used as-is against Neon Cloud.
Nothing else in the codebase needs to know which environment it's running in — only
`DATABASE_URL` and `NODE_ENV` change between the two compose files.

| | Development (`docker-compose.dev.yml`) | Production (`docker-compose.prod.yml`) |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `DATABASE_URL` | `postgres://neon:npg@neon-local:5432/neondb?sslmode=require` (fixed, points at the `neon-local` container) | Your real Neon Cloud connection string (`...neon.tech...`) |
| DB backend | Neon Local proxy → ephemeral Neon branch | Neon Cloud, directly |
| Env file | `.env.development` | `.env.production` |
| Source code | Bind-mounted, hot reload via `node --watch` | Baked into the image, immutable |

## Prerequisites

- Docker and Docker Compose
- A [Neon](https://console.neon.tech) account and project
- A Neon API key: console → **Account Settings → API Keys**
- Your Neon **Project ID** and the branch ID you want dev branches created from (usually your
  `main`/production branch) — both found on the project's Settings page

## Development: run locally with Neon Local

1. Copy the template and fill in your real Neon credentials:

   ```sh
   # .env.development already exists with placeholders — edit it in place
   ```

   Fill in `NEON_API_KEY`, `NEON_PROJECT_ID`, and `PARENT_BRANCH_ID`. Leave `DATABASE_URL` as-is —
   it points at the `neon-local` service by its Docker Compose service name and doesn't need real
   credentials (Neon Local always accepts `neon`/`npg`).

2. Start everything:

   ```sh
   docker compose -f docker-compose.dev.yml up --build
   ```

   This starts two containers:
   - `neon-local` — connects to your Neon project with your API key and creates a **new ephemeral
     branch** off `PARENT_BRANCH_ID`. The branch is deleted automatically when the container stops.
   - `app` — your Express app, hot-reloading on file changes in `src/`, connected to the ephemeral
     branch through the proxy.

3. The API is available at `http://localhost:3000` (try `http://localhost:3000/health`).

4. Run migrations against the ephemeral branch from inside the app container if needed:

   ```sh
   docker compose -f docker-compose.dev.yml exec app npm run db:migrate
   ```

5. Stop everything (and delete the ephemeral branch):

   ```sh
   docker compose -f docker-compose.dev.yml down
   ```

Every `up`/`down` cycle gives you a clean, disposable database — safe for running tests or trying
out risky migrations without touching real data.

## Production: deploy against Neon Cloud

1. Get your production connection string from the Neon console (**Connection Details** on your
   production branch) and put it in `.env.production` as `DATABASE_URL`, along with your
   production `ARCJET_KEY`. This file is git-ignored — never commit real secrets. In most real
   deployments you won't ship this file at all; instead inject `DATABASE_URL`/`ARCJET_KEY` as
   environment variables or secrets through your hosting platform (Fly.io, ECS, Kubernetes, etc.)
   and skip `env_file` in `docker-compose.prod.yml`.

2. Build and run:

   ```sh
   docker compose -f docker-compose.prod.yml up --build -d
   ```

   This runs a single `app` container, built from the `production` target of the
   [Dockerfile](Dockerfile) (no dev dependencies, no bind mounts, non-root user), talking straight
   to Neon Cloud. There is no Neon Local proxy in this file at all.

3. Check health and logs:

   ```sh
   docker compose -f docker-compose.prod.yml ps
   docker compose -f docker-compose.prod.yml logs -f app
   ```

## Files

- [`Dockerfile`](Dockerfile) — multi-stage build with `development` and `production` targets
- [`docker-compose.dev.yml`](docker-compose.dev.yml) — app + Neon Local proxy, hot reload
- [`docker-compose.prod.yml`](docker-compose.prod.yml) — app only, against Neon Cloud
- [`.env.development`](.env.development) / [`.env.production`](.env.production) — per-environment
  config (git-ignored; edit in place with your own credentials)
