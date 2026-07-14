package model

import (
	"testing"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
)

func TestBenefitValueRendersBoolsAndStrings(t *testing.T) {
	dto := NewMembershipBenefitDTO(repository.MembershipBenefit{
		Name:     "Early check-in",
		Golden:   "true",
		Platinum: "false",
		Diamond:  "25%",
	})
	if dto.Golden != true {
		t.Errorf("golden: want bool true, got %#v", dto.Golden)
	}
	if dto.Platinum != false {
		t.Errorf("platinum: want bool false, got %#v", dto.Platinum)
	}
	if dto.Diamond != "25%" {
		t.Errorf("diamond: want string 25%%, got %#v", dto.Diamond)
	}
}

func TestPointsTransactionDTOStringifiesNumbers(t *testing.T) {
	dto := NewPointsTransactionDTO(repository.PointsTransaction{
		ID:           7,
		Description:  "Redeemed: Spa",
		Category:     "points",
		TxnType:      "redeemed",
		Points:       5000,
		BalanceAfter: 1200,
	})
	if dto.ID != 7 {
		t.Errorf("id should stay numeric, got %d", dto.ID)
	}
	if dto.Points != "5000" {
		t.Errorf("points want string \"5000\", got %q", dto.Points)
	}
	if dto.Balance != "1200" {
		t.Errorf("balance want string \"1200\", got %q", dto.Balance)
	}
}

func TestRewardDTOStringifiesPointsRequired(t *testing.T) {
	dto := NewRewardDTO(repository.Reward{Title: "X", PointsRequired: 2000, Category: "services"})
	if dto.PointsRequired != "2000" {
		t.Errorf("pointsRequired want \"2000\", got %q", dto.PointsRequired)
	}
}
