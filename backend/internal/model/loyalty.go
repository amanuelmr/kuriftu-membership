package model

import (
	"strconv"
	"time"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
)

// PointsBalanceDTO matches getPointsBalance()'s return in api.ts.
type PointsBalanceDTO struct {
	Available int64 `json:"available"`
	Lifetime  int64 `json:"lifetime"`
}

// PointsTransactionDTO mirrors the `PointsTransaction` interface in api.ts,
// where points/amount/balance are strings and id is a number.
type PointsTransactionDTO struct {
	ID          int64  `json:"id"`
	Date        string `json:"date"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Points      string `json:"points"`
	Type        string `json:"type"`
	Amount      string `json:"amount"`
	Balance     string `json:"balance"`
}

func NewPointsTransactionDTO(t repository.PointsTransaction) PointsTransactionDTO {
	return PointsTransactionDTO{
		ID:          t.ID,
		Date:        t.OccurredAt.Format(time.RFC3339),
		Description: t.Description,
		Category:    t.Category,
		Points:      strconv.FormatInt(t.Points, 10),
		Type:        t.TxnType,
		Amount:      t.Amount,
		Balance:     strconv.FormatInt(t.BalanceAfter, 10),
	}
}

// RewardDTO mirrors the `Reward` interface in api.ts (pointsRequired is a string).
type RewardDTO struct {
	ID             string `json:"id"`
	Image          string `json:"image"`
	Title          string `json:"title"`
	Description    string `json:"description"`
	PointsRequired string `json:"pointsRequired"`
	Category       string `json:"category"`
}

func NewRewardDTO(r repository.Reward) RewardDTO {
	return RewardDTO{
		ID:             r.ID.String(),
		Image:          r.Image,
		Title:          r.Title,
		Description:    r.Description,
		PointsRequired: strconv.FormatInt(r.PointsRequired, 10),
		Category:       r.Category,
	}
}

// MembershipBenefitDTO mirrors the `MembershipBenefit` interface in api.ts.
// Each tier value is string | boolean.
type MembershipBenefitDTO struct {
	Name     string `json:"name"`
	Golden   any    `json:"golden"`
	Platinum any    `json:"platinum"`
	Diamond  any    `json:"diamond"`
}

func NewMembershipBenefitDTO(b repository.MembershipBenefit) MembershipBenefitDTO {
	return MembershipBenefitDTO{
		Name:     b.Name,
		Golden:   benefitValue(b.Golden),
		Platinum: benefitValue(b.Platinum),
		Diamond:  benefitValue(b.Diamond),
	}
}

// benefitValue renders "true"/"false" as JSON booleans and anything else as a
// string, matching the frontend's `string | boolean` type.
func benefitValue(s string) any {
	switch s {
	case "true":
		return true
	case "false":
		return false
	default:
		return s
	}
}
