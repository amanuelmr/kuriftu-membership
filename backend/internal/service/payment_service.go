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

var (
	ErrPaymentNotFound  = errors.New("payment not found")
	ErrPaymentForbidden = errors.New("payment does not belong to this user")
)

// PurposeMembershipUpgrade marks a payment whose success should grant a tier.
const PurposeMembershipUpgrade = "membership_upgrade"

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

// InitializeInput describes a payment to open. Purpose/TargetTier let a
// successful verification complete an action (e.g. grant a membership tier).
type InitializeInput struct {
	Amount      string
	Currency    string
	Description string
	Purpose     string
	TargetTier  string
}

// InitializePayment opens a Chapa checkout for the given amount and records a
// pending payment. The return URL carries the tx_ref so the return page can
// verify it.
func (s *PaymentService) InitializePayment(ctx context.Context, userID uuid.UUID, in InitializeInput) (InitializePaymentResult, error) {
	user, err := s.q.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return InitializePaymentResult{}, ErrUserNotFound
		}
		return InitializePaymentResult{}, fmt.Errorf("get user: %w", err)
	}
	currency := in.Currency
	if currency == "" {
		currency = "ETB"
	}
	purpose := in.Purpose
	if purpose == "" {
		purpose = "general"
	}
	txRef := "krf-" + uuid.NewString()

	checkoutURL, err := s.chapa.Initialize(ctx, chapa.InitializeRequest{
		Amount:      in.Amount,
		Currency:    currency,
		Email:       user.Email,
		FirstName:   user.FirstName,
		LastName:    user.LastName,
		TxRef:       txRef,
		CallbackURL: s.callbackURL,
		ReturnURL:   fmt.Sprintf("%s?tx_ref=%s", s.returnURL, txRef),
	})
	if err != nil {
		return InitializePaymentResult{}, err
	}

	if _, err := s.q.InsertPayment(ctx, repository.InsertPaymentParams{
		UserID:        userID,
		TxRef:         txRef,
		Description:   in.Description,
		Amount:        in.Amount,
		Currency:      currency,
		Status:        "upcoming",
		PaymentMethod: "Chapa",
		CheckoutUrl:   checkoutURL,
		Purpose:       purpose,
		TargetTier:    in.TargetTier,
	}); err != nil {
		return InitializePaymentResult{}, fmt.Errorf("insert payment: %w", err)
	}

	return InitializePaymentResult{CheckoutURL: checkoutURL, TxRef: txRef}, nil
}

// VerifyPayment confirms a payment with Chapa, updates its status, and (on
// success) completes the payment's purpose — e.g. granting a purchased tier.
// It only allows the owning user to verify their own payment.
func (s *PaymentService) VerifyPayment(ctx context.Context, userID uuid.UUID, txRef string) (repository.Payment, error) {
	payment, err := s.q.GetPaymentByTxRef(ctx, txRef)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.Payment{}, ErrPaymentNotFound
		}
		return repository.Payment{}, fmt.Errorf("get payment: %w", err)
	}
	if payment.UserID != userID {
		return repository.Payment{}, ErrPaymentForbidden
	}

	ok, err := s.chapa.Verify(ctx, txRef)
	if err != nil {
		return repository.Payment{}, err
	}
	status := "failed"
	if ok {
		status = "completed"
	}

	updated, err := s.q.UpdatePaymentStatus(ctx, repository.UpdatePaymentStatusParams{TxRef: txRef, Status: status})
	if err != nil {
		return repository.Payment{}, fmt.Errorf("update status: %w", err)
	}

	// Grant the purchased tier on success. Idempotent: re-verifying just re-sets
	// the same tier. validTiers is defined in loyalty_service.go.
	if ok && updated.Purpose == PurposeMembershipUpgrade {
		if _, valid := validTiers[updated.TargetTier]; valid {
			if _, err := s.q.UpdateUserTier(ctx, repository.UpdateUserTierParams{
				ID:             userID,
				MembershipTier: validTiers[updated.TargetTier],
			}); err != nil {
				return repository.Payment{}, fmt.Errorf("grant tier: %w", err)
			}
		}
	}

	return updated, nil
}
