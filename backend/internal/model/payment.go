package model

import (
	"strings"
	"time"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
)

// PaymentMethodDTO mirrors the `PaymentMethod` interface in api.ts.
type PaymentMethodDTO struct {
	ID          string `json:"id"`
	Type        string `json:"type"` // visa | mastercard | amex | discover
	LastFour    string `json:"lastFour"`
	ExpiryMonth string `json:"expiryMonth"`
	ExpiryYear  string `json:"expiryYear"`
	Name        string `json:"name"`
	IsDefault   bool   `json:"isDefault"`
}

func NewPaymentMethodDTO(m repository.PaymentMethod) PaymentMethodDTO {
	return PaymentMethodDTO{
		ID:          m.ID.String(),
		Type:        m.Brand,
		LastFour:    m.LastFour,
		ExpiryMonth: m.ExpMonth,
		ExpiryYear:  m.ExpYear,
		Name:        m.Name,
		IsDefault:   m.IsDefault,
	}
}

// PaymentDTO mirrors the `Payment` interface in api.ts.
type PaymentDTO struct {
	ID            string `json:"id"`
	Date          string `json:"date"`
	Description   string `json:"description"`
	Amount        string `json:"amount"`
	Status        string `json:"status"`
	PaymentMethod string `json:"paymentMethod"`
}

func NewPaymentDTO(p repository.Payment) PaymentDTO {
	return PaymentDTO{
		ID:            p.ID.String(),
		Date:          p.OccurredAt.Format(time.RFC3339),
		Description:   p.Description,
		Amount:        p.Amount,
		Status:        p.Status,
		PaymentMethod: p.PaymentMethod,
	}
}

// DetectCardBrand infers the card brand from the leading digits of a card
// number. It is used to store a display brand WITHOUT persisting the PAN.
func DetectCardBrand(cardNumber string) string {
	n := strings.ReplaceAll(strings.ReplaceAll(cardNumber, " ", ""), "-", "")
	switch {
	case strings.HasPrefix(n, "4"):
		return "visa"
	case len(n) >= 2 && n[:2] >= "51" && n[:2] <= "55":
		return "mastercard"
	case strings.HasPrefix(n, "34") || strings.HasPrefix(n, "37"):
		return "amex"
	case strings.HasPrefix(n, "6011") || strings.HasPrefix(n, "65"):
		return "discover"
	default:
		return "visa" // reasonable default for an unknown test PAN
	}
}

// LastFour returns the last four digits of a card number (or fewer if short).
func LastFour(cardNumber string) string {
	n := strings.ReplaceAll(strings.ReplaceAll(cardNumber, " ", ""), "-", "")
	if len(n) <= 4 {
		return n
	}
	return n[len(n)-4:]
}
