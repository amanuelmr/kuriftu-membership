package handler

import (
	"errors"
	"net/http"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/middleware"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/model"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/service"
)

type UserHandler struct {
	users *service.UserService
}

func NewUserHandler(users *service.UserService) *UserHandler {
	return &UserHandler{users: users}
}

// --- request payloads (match frontend/src/lib/api.ts) ---

type signupRequest struct {
	Fname    string `json:"fname" validate:"required"`
	Lname    string `json:"lname" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Phone    string `json:"phone"`
	Password string `json:"password" validate:"required,min=8"`
}

type loginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type updateProfileRequest struct {
	FirstName *string `json:"firstName"`
	LastName  *string `json:"lastName"`
	Phone     *string `json:"phone"`
	Avatar    *string `json:"avatar"`
}

// authResponse is the { token, user } shape the login page expects.
type authResponse struct {
	Token string        `json:"token"`
	User  model.UserDTO `json:"user"`
}

// Signup handles POST /api/auth/signup.
func (h *UserHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req signupRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	token, user, err := h.users.Signup(r.Context(), service.SignupInput{
		Fname:    req.Fname,
		Lname:    req.Lname,
		Email:    req.Email,
		Phone:    req.Phone,
		Password: req.Password,
	})
	if err != nil {
		if errors.Is(err, service.ErrEmailTaken) {
			writeError(w, http.StatusConflict, "email already registered")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}

	writeJSON(w, http.StatusCreated, authResponse{Token: token, User: model.NewUserDTO(user)})
}

// Login handles POST /api/auth/login.
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	token, user, err := h.users.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, "invalid email or password")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not log in")
		return
	}

	writeJSON(w, http.StatusOK, authResponse{Token: token, User: model.NewUserDTO(user)})
}

// Me handles GET /api/users/me.
func (h *UserHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	user, err := h.users.GetByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, model.NewUserDTO(user))
}

// UpdateMe handles PUT /api/users/me.
func (h *UserHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req updateProfileRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	user, err := h.users.Update(r.Context(), userID, service.UpdateInput{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
		Avatar:    req.Avatar,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not update profile")
		return
	}
	writeJSON(w, http.StatusOK, model.NewUserDTO(user))
}
