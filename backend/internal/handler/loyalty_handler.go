package handler

import (
	"errors"
	"net/http"

	"github.com/google/uuid"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/middleware"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/model"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/service"
)

type LoyaltyHandler struct {
	loyalty *service.LoyaltyService
}

func NewLoyaltyHandler(loyalty *service.LoyaltyService) *LoyaltyHandler {
	return &LoyaltyHandler{loyalty: loyalty}
}

// PointsBalance handles GET /api/points/balance.
func (h *LoyaltyHandler) PointsBalance(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	available, lifetime, err := h.loyalty.Balance(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, model.PointsBalanceDTO{Available: available, Lifetime: lifetime})
}

// PointsHistory handles GET /api/points/history.
func (h *LoyaltyHandler) PointsHistory(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	txns, err := h.loyalty.History(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not fetch points history")
		return
	}
	out := make([]model.PointsTransactionDTO, 0, len(txns))
	for _, t := range txns {
		out = append(out, model.NewPointsTransactionDTO(t))
	}
	writeJSON(w, http.StatusOK, out)
}

// Rewards handles GET /api/rewards[?category=].
func (h *LoyaltyHandler) Rewards(w http.ResponseWriter, r *http.Request) {
	rewards, err := h.loyalty.ListRewards(r.Context(), r.URL.Query().Get("category"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not fetch rewards")
		return
	}
	out := make([]model.RewardDTO, 0, len(rewards))
	for _, rw := range rewards {
		out = append(out, model.NewRewardDTO(rw))
	}
	writeJSON(w, http.StatusOK, out)
}

type redeemRequest struct {
	RewardID string `json:"rewardId" validate:"required"`
}

// RedeemReward handles POST /api/rewards/redeem.
func (h *LoyaltyHandler) RedeemReward(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req redeemRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	rewardID, err := uuid.Parse(req.RewardID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid rewardId")
		return
	}

	newBalance, err := h.loyalty.RedeemReward(r.Context(), userID, rewardID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrRewardNotFound):
			writeError(w, http.StatusNotFound, "reward not found")
		case errors.Is(err, service.ErrInsufficientPoints):
			writeError(w, http.StatusUnprocessableEntity, "insufficient points")
		default:
			writeError(w, http.StatusInternalServerError, "could not redeem reward")
		}
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "available": newBalance})
}

// MembershipBenefits handles GET /api/membership/benefits.
func (h *LoyaltyHandler) MembershipBenefits(w http.ResponseWriter, r *http.Request) {
	benefits, err := h.loyalty.ListBenefits(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not fetch benefits")
		return
	}
	out := make([]model.MembershipBenefitDTO, 0, len(benefits))
	for _, b := range benefits {
		out = append(out, model.NewMembershipBenefitDTO(b))
	}
	writeJSON(w, http.StatusOK, out)
}

type upgradeRequest struct {
	Tier string `json:"tier" validate:"required"`
}

// UpgradeMembership handles POST /api/membership/upgrade.
func (h *LoyaltyHandler) UpgradeMembership(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req upgradeRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	user, err := h.loyalty.UpgradeTier(r.Context(), userID, req.Tier)
	if err != nil {
		if errors.Is(err, service.ErrInvalidTier) {
			writeError(w, http.StatusBadRequest, "invalid membership tier")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not upgrade membership")
		return
	}
	writeJSON(w, http.StatusOK, model.NewUserDTO(user))
}
