package handler

import (
	"net/http"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/middleware"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/model"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/service"
)

type CatalogHandler struct {
	catalog *service.CatalogService
}

func NewCatalogHandler(catalog *service.CatalogService) *CatalogHandler {
	return &CatalogHandler{catalog: catalog}
}

// Bookings handles GET /api/bookings[?status=].
func (h *CatalogHandler) Bookings(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	bookings, err := h.catalog.Bookings(r.Context(), userID, r.URL.Query().Get("status"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not fetch bookings")
		return
	}
	out := make([]model.BookingDTO, 0, len(bookings))
	for _, b := range bookings {
		out = append(out, model.NewBookingDTO(b))
	}
	writeJSON(w, http.StatusOK, out)
}

// Offers handles GET /api/offers.
func (h *CatalogHandler) Offers(w http.ResponseWriter, r *http.Request) {
	offers, err := h.catalog.Offers(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not fetch offers")
		return
	}
	out := make([]model.OfferDTO, 0, len(offers))
	for _, o := range offers {
		out = append(out, model.NewOfferDTO(o))
	}
	writeJSON(w, http.StatusOK, out)
}

type surveyRequest struct {
	VisitPurpose           string   `json:"visitPurpose" validate:"required"`
	PreferredAccommodation []string `json:"preferredAccommodation"`
	Interests              []string `json:"interests"`
	TravelFrequency        string   `json:"travelFrequency" validate:"required"`
	SpecialOccasions       string   `json:"specialOccasions"`
	AdditionalNotes        string   `json:"additionalNotes"`
}

// SaveSurvey handles POST /api/survey.
func (h *CatalogHandler) SaveSurvey(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req surveyRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	survey, err := h.catalog.SaveSurvey(r.Context(), userID, service.SaveSurveyInput{
		VisitPurpose:           req.VisitPurpose,
		PreferredAccommodation: req.PreferredAccommodation,
		Interests:              req.Interests,
		TravelFrequency:        req.TravelFrequency,
		SpecialOccasions:       req.SpecialOccasions,
		AdditionalNotes:        req.AdditionalNotes,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not save survey")
		return
	}
	writeJSON(w, http.StatusCreated, model.NewSurveyDTO(survey))
}
