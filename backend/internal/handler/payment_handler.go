package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/middleware"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/model"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/service"
)

type PaymentHandler struct {
	payments *service.PaymentService
}

func NewPaymentHandler(payments *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{payments: payments}
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
	Amount      string `json:"amount" validate:"required"`
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
		writeError(w, http.StatusInternalServerError, "could not start payment")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"checkoutUrl": res.CheckoutURL, "txRef": res.TxRef})
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
