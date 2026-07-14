// Package db embeds the SQL migration files so the compiled binary can apply
// them on startup without requiring the migrate CLI. The same files on disk
// are read by sqlc at code-generation time (see backend/sqlc.yaml).
package db

import "embed"

//go:embed migrations/*.sql
var MigrationsFS embed.FS
