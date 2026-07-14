// Package handler contains the chi HTTP handlers. Handlers parse/validate
// requests, call services, and render JSON. They hold no business logic.
package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-playground/validator/v10"
)

// validate is shared across handlers for struct validation.
var validate = validator.New()

// errorBody is the standard error envelope returned to clients.
type errorBody struct {
	Error string `json:"error"`
}

// writeJSON renders v as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("encode response", "err", err)
	}
}

// writeError renders a JSON error envelope.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, errorBody{Error: msg})
}

// decodeJSON parses the request body into dst and validates it.
func decodeJSON(r *http.Request, dst any) error {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		return errors.New("invalid JSON body")
	}
	if err := validate.Struct(dst); err != nil {
		return err
	}
	return nil
}
