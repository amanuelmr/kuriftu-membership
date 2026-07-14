package model

import (
	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
)

const dateLayout = "2006-01-02"

// BookingDTO mirrors the `Booking` interface in api.ts.
type BookingDTO struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	Location  string   `json:"location"`
	Image     string   `json:"image"`
	CheckIn   string   `json:"checkIn"`
	CheckOut  string   `json:"checkOut"`
	Guests    int32    `json:"guests"`
	Status    string   `json:"status"`
	Price     string   `json:"price"`
	Amenities []string `json:"amenities"`
}

func NewBookingDTO(b repository.Booking) BookingDTO {
	return BookingDTO{
		ID:        b.ID.String(),
		Title:     b.Title,
		Location:  b.Location,
		Image:     b.Image,
		CheckIn:   b.CheckIn.Format(dateLayout),
		CheckOut:  b.CheckOut.Format(dateLayout),
		Guests:    b.Guests,
		Status:    b.Status,
		Price:     b.Price,
		Amenities: b.Amenities,
	}
}

// OfferDTO mirrors the `Offer` interface in api.ts.
type OfferDTO struct {
	ID          string `json:"id"`
	Image       string `json:"image"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Expiry      string `json:"expiry"`
	Discount    string `json:"discount"`
}

func NewOfferDTO(o repository.Offer) OfferDTO {
	return OfferDTO{
		ID:          o.ID.String(),
		Image:       o.Image,
		Title:       o.Title,
		Description: o.Description,
		Expiry:      o.Expiry.Format(dateLayout),
		Discount:    o.Discount,
	}
}

// SurveyDTO mirrors the survey form (camelCase) in survey/page.tsx.
type SurveyDTO struct {
	VisitPurpose           string   `json:"visitPurpose"`
	PreferredAccommodation []string `json:"preferredAccommodation"`
	Interests              []string `json:"interests"`
	TravelFrequency        string   `json:"travelFrequency"`
	SpecialOccasions       string   `json:"specialOccasions"`
	AdditionalNotes        string   `json:"additionalNotes"`
}

func NewSurveyDTO(s repository.Survey) SurveyDTO {
	return SurveyDTO{
		VisitPurpose:           s.VisitPurpose,
		PreferredAccommodation: s.PreferredAccommodation,
		Interests:              s.Interests,
		TravelFrequency:        s.TravelFrequency,
		SpecialOccasions:       s.SpecialOccasions,
		AdditionalNotes:        s.AdditionalNotes,
	}
}
