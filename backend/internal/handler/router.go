package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/auth"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/middleware"
)

// Router wires all routes. New resource handlers are registered here as the
// backend grows through the planned phases.
func Router(authMgr *auth.Manager, corsOrigins []string, users *UserHandler, loyalty *LoyaltyHandler) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Route("/api", func(r chi.Router) {
		// Public
		r.Post("/auth/signup", users.Signup)
		r.Post("/auth/login", users.Login)

		// Bearer-protected
		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticator(authMgr))

			r.Get("/users/me", users.Me)
			r.Put("/users/me", users.UpdateMe)

			r.Get("/points/balance", loyalty.PointsBalance)
			r.Get("/points/history", loyalty.PointsHistory)

			r.Get("/rewards", loyalty.Rewards)
			r.Post("/rewards/redeem", loyalty.RedeemReward)

			r.Get("/membership/benefits", loyalty.MembershipBenefits)
			r.Post("/membership/upgrade", loyalty.UpgradeMembership)
		})
	})

	return r
}
