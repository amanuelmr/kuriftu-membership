// Package model holds the API DTOs. These are shaped to match the frontend
// contract in frontend/src/lib/api.ts exactly (camelCase JSON keys, RFC3339
// dates), decoupling the wire format from the database column names.
package model

import (
	"time"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
)

// UserDTO mirrors the `User` interface in frontend/src/lib/api.ts.
type UserDTO struct {
	ID             string `json:"id"`
	FirstName      string `json:"firstName"`
	LastName       string `json:"lastName"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	Avatar         string `json:"avatar,omitempty"`
	MembershipTier string `json:"membershipTier"`
	MembershipID   string `json:"membershipId"`
	MemberSince    string `json:"memberSince"`
	ExpiryDate     string `json:"expiryDate"`
	Points         int64  `json:"points"`
	LifetimePoints int64  `json:"lifetimePoints"`
}

// NewUserDTO converts a database user row into the API DTO.
func NewUserDTO(u repository.User) UserDTO {
	return UserDTO{
		ID:             u.ID.String(),
		FirstName:      u.FirstName,
		LastName:       u.LastName,
		Email:          u.Email,
		Phone:          u.Phone,
		Avatar:         u.Avatar,
		MembershipTier: string(u.MembershipTier),
		MembershipID:   u.MembershipID,
		MemberSince:    u.MemberSince.Format(time.RFC3339),
		ExpiryDate:     u.ExpiryDate.Format(time.RFC3339),
		Points:         u.Points,
		LifetimePoints: u.LifetimePoints,
	}
}
