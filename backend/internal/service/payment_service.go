package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/chapa"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/model"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
)

var ErrPaymentNotFound = errors.New("payment not found")

// PaymentService manages stored payment methods (brand + last4 only) and
// payments processed through Chapa.
type PaymentService struct {
	q           repository.Querier
	chapa       *chapa.Client
	callbackURL string // APP_BASE_URL/api/payments/webhook
	returnURL   string // FRONTEND_URL/dashboard/payments
}

func NewPaymentService(q repository.Querier, chapaClient *chapa.Client, callbackURL, returnURL string) *PaymentService {
	return &PaymentService{q: q, chapa: chapaClient, callbackURL: callbackURL, returnURL: returnURL}
}

func (s *PaymentService) ListMethods(ctx context.Context, userID uuid.UUID) ([]repository.PaymentMethod, error) {
	return s.q.ListPaymentMethods(ctx, userID)
}

// AddMethodInput is the card form from api.ts. The PAN and CVV are used only to
// derive brand + last4 and are never persisted.
type AddMethodInput struct {
	CardNumber     string
	CardholderName string
	ExpiryMonth    string
	ExpiryYear     string
	CVV            string
	SetAsDefault   bool
}

func (s *PaymentService) AddMethod(ctx context.Context, userID uuid.UUID, in AddMethodInput) (repository.PaymentMethod, error) {
	if in.SetAsDefault {
		if err := s.q.ClearDefaultPaymentMethods(ctx, userID); err != nil {
			return repository.PaymentMethod{}, fmt.Errorf("clear defaults: %w", err)
		}
	}
	return s.q.InsertPaymentMethod(ctx, repository.InsertPaymentMethodParams{
		UserID:    userID,
		Brand:     model.DetectCardBrand(in.CardNumber),
		LastFour:  model.LastFour(in.CardNumber),
		ExpMonth:  in.ExpiryMonth,
		ExpYear:   in.ExpiryYear,
		Name:      in.CardholderName,
		IsDefault: in.SetAsDefault,
	})
}

func (s *PaymentService) History(ctx context.Context, userID uuid.UUID) ([]repository.Payment, error) {
	return s.q.ListPayments(ctx, userID)
}

// InitializePaymentResult is returned to the client to continue checkout.
type InitializePaymentResult struct {
	CheckoutURL string
	TxRef       string
}

// InitializePayment opens a Chapa checkout for the given amount and records a
// pending payment.
func (s *PaymentService) InitializePayment(ctx context.Context, userID uuid.UUID, amount, currency, description string) (InitializePaymentResult, error) {
	user, err := s.q.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return InitializePaymentResult{}, ErrUserNotFound
		}
		return InitializePaymentResult{}, fmt.Errorf("get user: %w", err)
	}
	if currency == "" {
		currency = "ETB"
	}
	txRef := "krf-" + uuid.NewString()

	checkoutURL, err := s.chapa.Initialize(ctx, chapa.InitializeRequest{
		Amount:      amount,
		Currency:    currency,
		Email:       user.Email,
		FirstName:   user.FirstName,
		LastName:    user.LastName,
		TxRef:       txRef,
		CallbackURL: s.callbackURL,
		ReturnURL:   s.returnURL,
	})
	if err != nil {
		return InitializePaymentResult{}, err
	}

	if _, err := s.q.InsertPayment(ctx, repository.InsertPaymentParams{
		UserID:        userID,
		TxRef:         txRef,
		Description:   description,
		Amount:        amount,
		Currency:      currency,
		Status:        "upcoming",
		PaymentMethod: "Chapa",
		CheckoutUrl:   checkoutURL,
	}); err != nil {
		return InitializePaymentResult{}, fmt.Errorf("insert payment: %w", err)
	}

	return InitializePaymentResult{CheckoutURL: checkoutURL, TxRef: txRef}, nil
}

// VerifyPayment confirms a payment with Chapa and updates its status.
func (s *PaymentService) VerifyPayment(ctx context.Context, txRef string) (repository.Payment, error) {
	if _, err := s.q.GetPaymentByTxRef(ctx, txRef); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.Payment{}, ErrPaymentNotFound
		}
		return repository.Payment{}, fmt.Errorf("get payment: %w", err)
	}

	ok, err := s.chapa.Verify(ctx, txRef)
	if err != nil {
		return repository.Payment{}, err
	}
	status := "failed"
	if ok {
		status = "completed"
	}
	return s.q.UpdatePaymentStatus(ctx, repository.UpdatePaymentStatusParams{TxRef: txRef, Status: status})
}
