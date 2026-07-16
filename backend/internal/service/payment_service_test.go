package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/chapa"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
)

// fakeQuerier stubs just the queries the payment flow touches; everything
// else panics via the embedded nil interface.
type fakeQuerier struct {
	repository.Querier
	user        repository.User
	inserted    *repository.InsertPaymentParams
	payments    map[string]repository.Payment
	tierUpdates []repository.UpdateUserTierParams
}

func newFakeQuerier(tier repository.MembershipTier) *fakeQuerier {
	return &fakeQuerier{
		user: repository.User{
			ID:             uuid.New(),
			FirstName:      "Test",
			LastName:       "Member",
			Email:          "member@example.com",
			MembershipTier: tier,
		},
		payments: map[string]repository.Payment{},
	}
}

func (f *fakeQuerier) GetUserByID(_ context.Context, _ uuid.UUID) (repository.User, error) {
	return f.user, nil
}

func (f *fakeQuerier) InsertPayment(_ context.Context, arg repository.InsertPaymentParams) (repository.Payment, error) {
	f.inserted = &arg
	p := repository.Payment{
		ID:          uuid.New(),
		UserID:      arg.UserID,
		TxRef:       arg.TxRef,
		Description: arg.Description,
		Amount:      arg.Amount,
		Currency:    arg.Currency,
		Status:      arg.Status,
		Purpose:     arg.Purpose,
		TargetTier:  arg.TargetTier,
	}
	f.payments[arg.TxRef] = p
	return p, nil
}

func (f *fakeQuerier) GetPaymentByTxRef(_ context.Context, txRef string) (repository.Payment, error) {
	p, ok := f.payments[txRef]
	if !ok {
		return repository.Payment{}, pgx.ErrNoRows
	}
	return p, nil
}

func (f *fakeQuerier) UpdatePaymentStatus(_ context.Context, arg repository.UpdatePaymentStatusParams) (repository.Payment, error) {
	p := f.payments[arg.TxRef]
	p.Status = arg.Status
	f.payments[arg.TxRef] = p
	return p, nil
}

func (f *fakeQuerier) UpdateUserTier(_ context.Context, arg repository.UpdateUserTierParams) (repository.User, error) {
	f.tierUpdates = append(f.tierUpdates, arg)
	f.user.MembershipTier = arg.MembershipTier
	return f.user, nil
}

func newTestService(q repository.Querier) *PaymentService {
	// An empty secret key puts the Chapa client in mock mode: initialize
	// returns the return URL and verification always succeeds.
	return NewPaymentService(q, chapa.New("", ""), "http://api.test/webhook", "http://app.test/return")
}

func TestInitializePaymentOverridesUpgradePricing(t *testing.T) {
	q := newFakeQuerier(repository.MembershipTierGolden)
	svc := newTestService(q)

	_, err := svc.InitializePayment(context.Background(), q.user.ID, InitializeInput{
		Amount:      "1", // attacker-chosen price: must be ignored
		Currency:    "USD",
		Description: "cheap diamond please",
		Purpose:     PurposeMembershipUpgrade,
		TargetTier:  "Platinum",
	})
	if err != nil {
		t.Fatalf("InitializePayment: %v", err)
	}
	if q.inserted == nil {
		t.Fatal("no payment recorded")
	}
	want := tierCatalog["Platinum"].PriceETB
	if q.inserted.Amount != want {
		t.Errorf("amount = %q, want catalog price %q", q.inserted.Amount, want)
	}
	if q.inserted.Currency != "ETB" {
		t.Errorf("currency = %q, want ETB", q.inserted.Currency)
	}
	if q.inserted.Description != "Platinum membership upgrade" {
		t.Errorf("description = %q, client value must not survive", q.inserted.Description)
	}
}

func TestInitializePaymentRejectsInvalidUpgrades(t *testing.T) {
	cases := []struct {
		name    string
		current repository.MembershipTier
		target  string
	}{
		{"unknown tier", repository.MembershipTierBasic, "Bogus"},
		{"same tier", repository.MembershipTierGolden, "Golden"},
		{"downgrade", repository.MembershipTierDiamond, "Platinum"},
		{"basic is not purchasable", repository.MembershipTierGolden, "Basic"},
		{"empty tier", repository.MembershipTierBasic, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			q := newFakeQuerier(tc.current)
			svc := newTestService(q)
			_, err := svc.InitializePayment(context.Background(), q.user.ID, InitializeInput{
				Purpose:    PurposeMembershipUpgrade,
				TargetTier: tc.target,
			})
			if err != ErrInvalidUpgrade {
				t.Fatalf("err = %v, want ErrInvalidUpgrade", err)
			}
			if q.inserted != nil {
				t.Error("payment must not be recorded for a rejected upgrade")
			}
		})
	}
}

func TestInitializePaymentRequiresAmountForGeneralPayments(t *testing.T) {
	q := newFakeQuerier(repository.MembershipTierBasic)
	svc := newTestService(q)
	_, err := svc.InitializePayment(context.Background(), q.user.ID, InitializeInput{Purpose: "general"})
	if err != ErrAmountRequired {
		t.Fatalf("err = %v, want ErrAmountRequired", err)
	}
}

func TestConfirmPaymentGrantsTierToOwnerAndIsIdempotent(t *testing.T) {
	q := newFakeQuerier(repository.MembershipTierBasic)
	svc := newTestService(q)

	res, err := svc.InitializePayment(context.Background(), q.user.ID, InitializeInput{
		Purpose:    PurposeMembershipUpgrade,
		TargetTier: "Golden",
	})
	if err != nil {
		t.Fatalf("InitializePayment: %v", err)
	}

	for i := 0; i < 2; i++ { // webhook + return page may both confirm
		p, err := svc.ConfirmPayment(context.Background(), res.TxRef)
		if err != nil {
			t.Fatalf("ConfirmPayment #%d: %v", i+1, err)
		}
		if p.Status != "completed" {
			t.Fatalf("status = %q, want completed", p.Status)
		}
	}

	if len(q.tierUpdates) != 2 {
		t.Fatalf("tier updates = %d, want 2 (idempotent re-grant)", len(q.tierUpdates))
	}
	for _, u := range q.tierUpdates {
		if u.ID != q.user.ID {
			t.Error("tier granted to a different user than the payment owner")
		}
		if u.MembershipTier != repository.MembershipTierGolden {
			t.Errorf("granted tier = %q, want Golden", u.MembershipTier)
		}
	}
}

func TestConfirmPaymentUnknownTxRef(t *testing.T) {
	q := newFakeQuerier(repository.MembershipTierBasic)
	svc := newTestService(q)
	if _, err := svc.ConfirmPayment(context.Background(), "krf-nope"); err != ErrPaymentNotFound {
		t.Fatalf("err = %v, want ErrPaymentNotFound", err)
	}
}

func TestUpgradeOffer(t *testing.T) {
	if _, err := upgradeOffer("Basic", "Golden"); err != nil {
		t.Errorf("Basic->Golden should be allowed: %v", err)
	}
	if _, err := upgradeOffer("Golden", "Diamond"); err != nil {
		t.Errorf("Golden->Diamond should be allowed: %v", err)
	}
	for _, bad := range [][2]string{
		{"Golden", "Golden"},
		{"Diamond", "Golden"},
		{"Basic", "Basic"},
		{"Basic", "Nope"},
	} {
		if _, err := upgradeOffer(bad[0], bad[1]); err != ErrInvalidUpgrade {
			t.Errorf("upgradeOffer(%q, %q) err = %v, want ErrInvalidUpgrade", bad[0], bad[1], err)
		}
	}
}
