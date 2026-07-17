// Package chapa is a minimal client for the Chapa payment gateway
// (https://developer.chapa.co). When no secret key is configured it runs in
// mock mode, returning a simulated checkout URL and treating verification as
// successful — so the payment flow is fully exercisable in local dev and tests
// without a real Chapa account. Supplying a CHASECK_TEST-... key switches it to
// the real test API.
package chapa

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"
)

// APIError is returned when Chapa accepts the HTTP request but reports a
// failure in the body (e.g. a validation error such as a rejected email), as
// opposed to a transport error. Callers can errors.As to it to surface a
// meaningful message to the end user instead of a generic 500.
type APIError struct {
	StatusCode int
	Message    string              // best-effort human-readable summary
	Fields     map[string][]string // per-field validation errors, when present
}

func (e *APIError) Error() string {
	if e.Message != "" {
		return "chapa: " + e.Message
	}
	return "chapa: request rejected"
}

// parseChapaMessage extracts a human message (and any field errors) from
// Chapa's "message" field, which is a plain string on some errors and an
// object of {field: [messages]} on validation errors.
func parseChapaMessage(raw json.RawMessage) (string, map[string][]string) {
	if len(raw) == 0 {
		return "", nil
	}
	var s string
	if err := json.Unmarshal(raw, &s); err == nil {
		return s, nil
	}
	var fields map[string][]string
	if err := json.Unmarshal(raw, &fields); err == nil {
		parts := make([]string, 0, len(fields))
		for f, msgs := range fields {
			parts = append(parts, f+": "+strings.Join(msgs, ", "))
		}
		sort.Strings(parts)
		return strings.Join(parts, "; "), fields
	}
	return string(raw), nil
}

type Client struct {
	secretKey string
	baseURL   string
	http      *http.Client
}

func New(secretKey, baseURL string) *Client {
	return &Client{
		secretKey: secretKey,
		baseURL:   strings.TrimRight(baseURL, "/"),
		http:      &http.Client{Timeout: 15 * time.Second},
	}
}

// Mock reports whether the client is running without a real secret key.
func (c *Client) Mock() bool { return c.secretKey == "" }

// InitializeRequest holds the fields Chapa needs to open a checkout.
type InitializeRequest struct {
	Amount      string `json:"amount"`
	Currency    string `json:"currency"`
	Email       string `json:"email"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	TxRef       string `json:"tx_ref"`
	CallbackURL string `json:"callback_url"`
	ReturnURL   string `json:"return_url"`
}

type initializeResponse struct {
	Status  string          `json:"status"`
	Message json.RawMessage `json:"message"` // string OR {field:[msgs]} on validation errors
	Data    struct {
		CheckoutURL string `json:"checkout_url"`
	} `json:"data"`
}

// Initialize creates a checkout session and returns its hosted checkout URL.
func (c *Client) Initialize(ctx context.Context, req InitializeRequest) (string, error) {
	if c.Mock() {
		// Simulated hosted-checkout page that immediately points back at our
		// return URL (which already carries tx_ref) so the flow can be driven
		// end-to-end locally. Use the correct query separator.
		sep := "?"
		if strings.Contains(req.ReturnURL, "?") {
			sep = "&"
		}
		return req.ReturnURL + sep + "mock=1", nil
	}

	body, err := json.Marshal(req)
	if err != nil {
		return "", err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/transaction/initialize", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Authorization", "Bearer "+c.secretKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("chapa initialize: %w", err)
	}
	defer resp.Body.Close()

	var out initializeResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", fmt.Errorf("decode chapa response: %w", err)
	}
	if resp.StatusCode != http.StatusOK || out.Data.CheckoutURL == "" {
		msg, fields := parseChapaMessage(out.Message)
		return "", &APIError{StatusCode: resp.StatusCode, Message: msg, Fields: fields}
	}
	return out.Data.CheckoutURL, nil
}

type verifyResponse struct {
	Status string `json:"status"`
	Data   struct {
		Status string `json:"status"` // "success" | "failed" | "pending"
	} `json:"data"`
}

// Verify returns true when the transaction for txRef has succeeded.
func (c *Client) Verify(ctx context.Context, txRef string) (bool, error) {
	if c.Mock() {
		return true, nil // mock checkouts always succeed
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/transaction/verify/"+txRef, nil)
	if err != nil {
		return false, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+c.secretKey)

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return false, fmt.Errorf("chapa verify: %w", err)
	}
	defer resp.Body.Close()

	var out verifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return false, fmt.Errorf("decode chapa verify: %w", err)
	}
	return out.Data.Status == "success", nil
}
