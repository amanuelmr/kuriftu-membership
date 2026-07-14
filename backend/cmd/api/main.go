// Command api is the Kuriftu Membership backend HTTP server.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/auth"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/config"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/database"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/handler"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/service"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	if err := run(); err != nil {
		slog.Error("server failed", "err", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx := context.Background()

	// Apply migrations before opening the app pool.
	if err := database.Migrate(cfg.DatabaseURL); err != nil {
		return err
	}
	slog.Info("migrations applied")

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()
	slog.Info("database connected")

	// Wire dependencies: repository -> service -> handler.
	queries := repository.New(pool)
	authMgr := auth.NewManager(cfg.JWTSecret, cfg.JWTExpiry)
	userSvc := service.NewUserService(queries, authMgr)
	userHandler := handler.NewUserHandler(userSvc)

	router := handler.Router(authMgr, cfg.CORSOrigins, userHandler)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown on SIGINT/SIGTERM.
	shutdownErr := make(chan error, 1)
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		slog.Info("shutting down")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		shutdownErr <- srv.Shutdown(shutdownCtx)
	}()

	slog.Info("listening", "port", cfg.Port, "env", cfg.Env)
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return <-shutdownErr
}
