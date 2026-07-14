package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
)

// CatalogService covers bookings, offers, and the onboarding survey.
type CatalogService struct {
	q repository.Querier
}

func NewCatalogService(q repository.Querier) *CatalogService {
	return &CatalogService{q: q}
}

// Bookings returns a user's bookings, optionally filtered by status.
func (s *CatalogService) Bookings(ctx context.Context, userID uuid.UUID, status string) ([]repository.Booking, error) {
	filter := pgtype.Text{Valid: false}
	if status != "" {
		filter = pgtype.Text{String: status, Valid: true}
	}
	return s.q.ListBookings(ctx, repository.ListBookingsParams{UserID: userID, Status: filter})
}

// Offers returns all active offers.
func (s *CatalogService) Offers(ctx context.Context) ([]repository.Offer, error) {
	return s.q.ListOffers(ctx)
}

// SaveSurveyInput carries the onboarding survey answers.
type SaveSurveyInput struct {
	VisitPurpose           string
	PreferredAccommodation []string
	Interests              []string
	TravelFrequency        string
	SpecialOccasions       string
	AdditionalNotes        string
}

// SaveSurvey upserts the survey response for a user.
func (s *CatalogService) SaveSurvey(ctx context.Context, userID uuid.UUID, in SaveSurveyInput) (repository.Survey, error) {
	return s.q.UpsertSurvey(ctx, repository.UpsertSurveyParams{
		UserID:                 userID,
		VisitPurpose:           in.VisitPurpose,
		PreferredAccommodation: nonNilSlice(in.PreferredAccommodation),
		Interests:              nonNilSlice(in.Interests),
		TravelFrequency:        in.TravelFrequency,
		SpecialOccasions:       in.SpecialOccasions,
		AdditionalNotes:        in.AdditionalNotes,
	})
}

// nonNilSlice guarantees a non-nil slice so it maps to a Postgres empty array.
func nonNilSlice(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}
