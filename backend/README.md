# Kuriftu Membership — Backend

Go API for the Kuriftu Membership apps. Implements the contract defined in
`frontend/src/lib/api.ts`.

## Stack

- **chi** — HTTP router on top of `net/http`
- **pgx/v5** + **sqlc** — type-safe SQL (no ORM); queries in `db/query`, generated code in `internal/repository`
- **PostgreSQL 16**
- **golang-migrate** — migrations in `db/migrations`, embedded in the binary and applied on startup
- **golang-jwt/v5** + **bcrypt** — auth
- **slog** — structured logging · **go-playground/validator** — request validation

## Layout

```
cmd/api/            entrypoint
internal/
  config/           env-based config
  database/         pgx pool + migrate-on-startup
  model/            API DTOs (match the frontend contract, camelCase JSON)
  repository/        sqlc-generated DB access (do not edit)
  service/          business logic
  handler/          chi handlers + router
  middleware/       JWT auth guard
  auth/             JWT + bcrypt
db/
  migrations/       *.up.sql / *.down.sql
  query/            *.sql (sqlc input)
```

## Run locally

```bash
# 1. Start Postgres (from repo root). Host port 5434 -> container 5432.
docker compose up -d

# 2. Configure env
cd backend
cp .env.example .env        # edit JWT_SECRET for anything real

# 3. Run (migrations apply automatically on startup)
make run                    # or: go run ./cmd/api
```

Server listens on `:8080`. Health check: `GET /health`.

## Common commands

```bash
make run      # run the server
make test     # go test ./...
make build    # build ./bin/api
make sqlc     # regenerate repository code after editing db/query or db/migrations
make db-up    # start Postgres
make db-reset # wipe + recreate the Postgres volume
```

## Implemented endpoints

Base path `/api`.

| Method | Path            | Auth   | Notes |
|--------|-----------------|--------|-------|
| GET    | `/health`       | –      | liveness |
| POST   | `/auth/signup`  | –      | `{fname,lname,email,phone,password}` → `{token,user}` (201) |
| POST   | `/auth/login`   | –      | `{email,password}` → `{token,user}` |
| GET    | `/users/me`     | Bearer | current user |
| PUT    | `/users/me`     | Bearer | partial profile update |
| GET    | `/points/balance` | Bearer | `{available, lifetime}` |
| GET    | `/points/history` | Bearer | points ledger, newest first |
| GET    | `/rewards`        | Bearer | rewards catalog (`?category=` optional) |
| POST   | `/rewards/redeem` | Bearer | `{rewardId}`; atomic deduct, 422 if short |
| GET    | `/membership/benefits` | Bearer | tier comparison |
| POST   | `/membership/upgrade`  | Bearer | `{tier}` → updated user |
| GET    | `/bookings[?status=]`  | Bearer | user's bookings |
| GET    | `/offers`              | Bearer | active offers |
| POST   | `/survey`              | Bearer | upsert onboarding survey |

Remaining endpoints (payment methods + history) are planned — see the project
plan.
