package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
)

var (
	ErrRewardNotFound     = errors.New("reward not found")
	ErrInsufficientPoints = errors.New("insufficient points")
	ErrInvalidTier        = errors.New("invalid membership tier")
)

var validTiers = map[string]repository.MembershipTier{
	"Basic":    repository.MembershipTierBasic,
	"Golden":   repository.MembershipTierGolden,
	"Platinum": repository.MembershipTierPlatinum,
	"Diamond":  repository.MembershipTierDiamond,
}

// LoyaltyService covers points, rewards, and membership. It needs the pool
// (not just the Querier) so reward redemption can run in a transaction.
type LoyaltyService struct {
	pool *pgxpool.Pool
	q    *repository.Queries
}

func NewLoyaltyService(pool *pgxpool.Pool, q *repository.Queries) *LoyaltyService {
	return &LoyaltyService{pool: pool, q: q}
}

// Balance returns the user's available and lifetime points.
func (s *LoyaltyService) Balance(ctx context.Context, userID uuid.UUID) (int64, int64, error) {
	user, err := s.q.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, 0, ErrUserNotFound
		}
		return 0, 0, fmt.Errorf("get user: %w", err)
	}
	return user.Points, user.LifetimePoints, nil
}

// History returns the user's points transactions, newest first.
func (s *LoyaltyService) History(ctx context.Context, userID uuid.UUID) ([]repository.PointsTransaction, error) {
	return s.q.ListPointsHistory(ctx, userID)
}

// ListRewards returns the rewards catalog, optionally filtered by category.
func (s *LoyaltyService) ListRewards(ctx context.Context, category string) ([]repository.Reward, error) {
	filter := pgtype.Text{Valid: false}
	if category != "" {
		filter = pgtype.Text{String: category, Valid: true}
	}
	return s.q.ListRewards(ctx, filter)
}

// RedeemReward atomically deducts the reward's cost, records a redemption, and
// writes a points-ledger entry. It rejects the redemption if the balance is
// insufficient. Returns the new available balance.
func (s *LoyaltyService) RedeemReward(ctx context.Context, userID, rewardID uuid.UUID) (int64, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) // no-op after a successful commit

	qtx := s.q.WithTx(tx)

	reward, err := qtx.GetReward(ctx, rewardID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrRewardNotFound
		}
		return 0, fmt.Errorf("get reward: %w", err)
	}

	// Deduct only if the balance covers the cost (enforced in SQL).
	newBalance, err := qtx.DeductUserPoints(ctx, repository.DeductUserPointsParams{
		ID:     userID,
		Points: reward.PointsRequired,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrInsufficientPoints
		}
		return 0, fmt.Errorf("deduct points: %w", err)
	}

	if _, err := qtx.InsertRedemption(ctx, repository.InsertRedemptionParams{
		UserID:      userID,
		RewardID:    rewardID,
		PointsSpent: reward.PointsRequired,
	}); err != nil {
		return 0, fmt.Errorf("insert redemption: %w", err)
	}

	if _, err := qtx.InsertPointsTransaction(ctx, repository.InsertPointsTransactionParams{
		UserID:       userID,
		Description:  "Redeemed: " + reward.Title,
		Category:     "points",
		TxnType:      "redeemed",
		Points:       reward.PointsRequired,
		Amount:       "",
		BalanceAfter: newBalance,
	}); err != nil {
		return 0, fmt.Errorf("insert transaction: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("commit: %w", err)
	}
	return newBalance, nil
}

// ListBenefits returns the membership benefit comparison rows.
func (s *LoyaltyService) ListBenefits(ctx context.Context) ([]repository.MembershipBenefit, error) {
	return s.q.ListMembershipBenefits(ctx)
}

// UpgradeTier sets the user's membership tier after validating it.
func (s *LoyaltyService) UpgradeTier(ctx context.Context, userID uuid.UUID, tier string) (repository.User, error) {
	t, ok := validTiers[tier]
	if !ok {
		return repository.User{}, ErrInvalidTier
	}
	user, err := s.q.UpdateUserTier(ctx, repository.UpdateUserTierParams{
		ID:             userID,
		MembershipTier: t,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.User{}, ErrUserNotFound
		}
		return repository.User{}, fmt.Errorf("update tier: %w", err)
	}
	return user, nil
}
