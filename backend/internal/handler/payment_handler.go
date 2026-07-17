package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/chapa"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/middleware"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/model"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/service"
)

// paymentRejectionMessage turns a Chapa rejection into a message the end user
// can act on, instead of a generic failure.
func paymentRejectionMessage(e *chapa.APIError) string {
	if _, ok := e.Fields["email"]; ok {
		return "Your email address wasn't accepted by our payment provider. Please use a valid email address and try again."
	}
	if e.Message != "" {
		return "Payment couldn't be started: " + e.Message
	}
	return "Our payment provider rejected the request. Please try again later."
}

type PaymentHandler struct {
	payments *service.PaymentService
	// webhookSecret verifies Chapa-Signature on webhook calls; empty (dev/
	// mock mode) skips verification.
	webhookSecret string
}

func NewPaymentHandler(payments *service.PaymentService, webhookSecret string) *PaymentHandler {
	return &PaymentHandler{payments: payments, webhookSecret: webhookSecret}
}

// PaymentMethods handles GET /api/payment-methods.
func (h *PaymentHandler) PaymentMethods(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	methods, err := h.payments.ListMethods(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not fetch payment methods")
		return
	}
	out := make([]model.PaymentMethodDTO, 0, len(methods))
	for _, m := range methods {
		out = append(out, model.NewPaymentMethodDTO(m))
	}
	writeJSON(w, http.StatusOK, out)
}

type addPaymentMethodRequest struct {
	CardNumber     string `json:"cardNumber" validate:"required"`
	CardholderName string `json:"cardholderName" validate:"required"`
	ExpiryMonth    string `json:"expiryMonth" validate:"required"`
	ExpiryYear     string `json:"expiryYear" validate:"required"`
	CVV            string `json:"cvv" validate:"required"`
	SetAsDefault   bool   `json:"setAsDefault"`
}

// AddPaymentMethod handles POST /api/payment-methods. The PAN and CVV are used
// only to derive brand + last4; neither is stored.
func (h *PaymentHandler) AddPaymentMethod(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req addPaymentMethodRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	method, err := h.payments.AddMethod(r.Context(), userID, service.AddMethodInput{
		CardNumber:     req.CardNumber,
		CardholderName: req.CardholderName,
		ExpiryMonth:    req.ExpiryMonth,
		ExpiryYear:     req.ExpiryYear,
		CVV:            req.CVV,
		SetAsDefault:   req.SetAsDefault,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not add payment method")
		return
	}
	writeJSON(w, http.StatusCreated, model.NewPaymentMethodDTO(method))
}

// PaymentHistory handles GET /api/payments/history.
func (h *PaymentHandler) PaymentHistory(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	payments, err := h.payments.History(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not fetch payment history")
		return
	}
	out := make([]model.PaymentDTO, 0, len(payments))
	for _, p := range payments {
		out = append(out, model.NewPaymentDTO(p))
	}
	writeJSON(w, http.StatusOK, out)
}

type initPaymentRequest struct {
	// Amount is required for general payments but ignored for membership
	// upgrades, whose price comes from the server-side tier catalog.
	Amount      string `json:"amount"`
	Currency    string `json:"currency"`
	Description string `json:"description"`
	Purpose     string `json:"purpose"`
	TargetTier  string `json:"targetTier"`
}

// InitializePayment handles POST /api/payments/initialize and returns a Chapa
// checkout URL to redirect the user to.
func (h *PaymentHandler) InitializePayment(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req initPaymentRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	res, err := h.payments.InitializePayment(r.Context(), userID, service.InitializeInput{
		Amount:      req.Amount,
		Currency:    req.Currency,
		Description: req.Description,
		Purpose:     req.Purpose,
		TargetTier:  req.TargetTier,
	})
	if err != nil {
		var apiErr *chapa.APIError
		switch {
		case errors.Is(err, service.ErrInvalidUpgrade):
			writeError(w, http.StatusBadRequest, "invalid membership upgrade")
		case errors.Is(err, service.ErrAmountRequired):
			writeError(w, http.StatusBadRequest, "amount is required")
		case errors.As(err, &apiErr):
			// Chapa rejected the request (e.g. an invalid email). Tell the user
			// what's wrong with a 400 rather than a blind 500.
			slog.Error("chapa rejected initialize", "userID", userID, "err", err)
			writeError(w, http.StatusBadRequest, paymentRejectionMessage(apiErr))
		default:
			slog.Error("initialize payment failed", "userID", userID, "err", err)
			writeError(w, http.StatusInternalServerError, "could not start payment")
		}
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"checkoutUrl": res.CheckoutURL, "txRef": res.TxRef})
}

// Webhook handles POST /api/payments/webhook — Chapa's server-to-server
// payment notification. It confirms the referenced payment with Chapa
// directly, so a forged tx_ref can't mark anything paid; the signature check
// (when a secret is configured) rejects third-party noise outright.
func (h *PaymentHandler) Webhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, "could not read body")
		return
	}

	if h.webhookSecret != "" && !validWebhookSignature(body, r, h.webhookSecret) {
		writeError(w, http.StatusUnauthorized, "invalid signature")
		return
	}

	var payload struct {
		TxRef  string `json:"tx_ref"`
		TrxRef string `json:"trx_ref"`
	}
	_ = json.Unmarshal(body, &payload)
	txRef := payload.TxRef
	if txRef == "" {
		txRef = payload.TrxRef
	}
	if txRef == "" {
		txRef = r.URL.Query().Get("tx_ref")
	}
	if txRef == "" {
		txRef = r.URL.Query().Get("trx_ref")
	}
	if txRef == "" {
		writeError(w, http.StatusBadRequest, "missing tx_ref")
		return
	}

	if _, err := h.payments.ConfirmPayment(r.Context(), txRef); err != nil {
		if errors.Is(err, service.ErrPaymentNotFound) {
			writeError(w, http.StatusNotFound, "payment not found")
			return
		}
		slog.Error("webhook confirm failed", "txRef", txRef, "err", err)
		writeError(w, http.StatusInternalServerError, "could not confirm payment")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// validWebhookSignature checks Chapa's HMAC-SHA256 hex signature of the raw
// body, sent as Chapa-Signature (or x-chapa-signature).
func validWebhookSignature(body []byte, r *http.Request, secret string) bool {
	sig := r.Header.Get("Chapa-Signature")
	if sig == "" {
		sig = r.Header.Get("x-chapa-signature")
	}
	if sig == "" {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(sig))
}

// VerifyPayment handles GET /api/payments/verify/{txRef}.
func (h *PaymentHandler) VerifyPayment(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	txRef := chi.URLParam(r, "txRef")
	payment, err := h.payments.VerifyPayment(r.Context(), userID, txRef)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrPaymentNotFound):
			writeError(w, http.StatusNotFound, "payment not found")
		case errors.Is(err, service.ErrPaymentForbidden):
			writeError(w, http.StatusForbidden, "forbidden")
		default:
			writeError(w, http.StatusInternalServerError, "could not verify payment")
		}
		return
	}
	writeJSON(w, http.StatusOK, model.NewPaymentDTO(payment))
}
