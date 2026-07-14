.PHONY: help run build test tidy sqlc db-up db-down db-reset

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'

run: ## Run the API server (migrations apply on startup)
	go run ./cmd/api

build: ## Build the API binary into ./bin
	go build -o bin/api ./cmd/api

test: ## Run all tests
	go test ./...

tidy: ## Tidy go.mod/go.sum
	go mod tidy

sqlc: ## Regenerate type-safe DB code from db/query
	sqlc generate

db-up: ## Start local Postgres (from repo root docker-compose)
	docker compose -f ../docker-compose.yml up -d

db-down: ## Stop local Postgres
	docker compose -f ../docker-compose.yml down

db-reset: ## Wipe and recreate local Postgres volume
	docker compose -f ../docker-compose.yml down -v && docker compose -f ../docker-compose.yml up -d
