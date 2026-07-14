// Package config loads application configuration from environment variables.
// Locally, a .env file is loaded first (via godotenv); real environment
// variables always take precedence over .env values.
package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	JWTExpiry   time.Duration
	CORSOrigins []string
	Env         string // "development" | "production"
}

// Load reads configuration from the environment. It attempts to load a .env
// file if present, then reads variables. Missing required values return an error.
func Load() (*Config, error) {
	// Best-effort .env load for local dev; ignore if the file is absent.
	_ = godotenv.Load()

	cfg := &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		JWTExpiry:   getEnvDuration("JWT_EXPIRY", 7*24*time.Hour),
		CORSOrigins: getEnvList("CORS_ORIGINS", []string{"http://localhost:3000"}),
		Env:         getEnv("APP_ENV", "development"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return fallback
}

func getEnvList(key string, fallback []string) []string {
	if v := os.Getenv(key); v != "" {
		var out []string
		for _, part := range splitAndTrim(v) {
			if part != "" {
				out = append(out, part)
			}
		}
		if len(out) > 0 {
			return out
		}
	}
	return fallback
}

func splitAndTrim(s string) []string {
	var out []string
	start := 0
	for i := 0; i <= len(s); i++ {
		if i == len(s) || s[i] == ',' {
			part := s[start:i]
			// trim spaces
			for len(part) > 0 && (part[0] == ' ' || part[0] == '\t') {
				part = part[1:]
			}
			for len(part) > 0 && (part[len(part)-1] == ' ' || part[len(part)-1] == '\t') {
				part = part[:len(part)-1]
			}
			out = append(out, part)
			start = i + 1
		}
	}
	return out
}
