// Package middleware provides HTTP middleware: the JWT auth guard plus
// request logging. (Recoverer, RequestID and CORS come from chi/cors.)
package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/auth"
)

type ctxKey string

const userIDKey ctxKey = "userID"

// Authenticator returns middleware that requires a valid Bearer token and
// injects the authenticated user id into the request context.
func Authenticator(mgr *auth.Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			token, ok := strings.CutPrefix(header, "Bearer ")
			if !ok || strings.TrimSpace(token) == "" {
				unauthorized(w)
				return
			}
			userID, err := mgr.ParseToken(strings.TrimSpace(token))
			if err != nil {
				unauthorized(w)
				return
			}
			ctx := context.WithValue(r.Context(), userIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// UserIDFromContext returns the authenticated user id set by Authenticator.
func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(userIDKey).(uuid.UUID)
	return id, ok
}

func unauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_, _ = w.Write([]byte(`{"error":"unauthorized"}`))
}
