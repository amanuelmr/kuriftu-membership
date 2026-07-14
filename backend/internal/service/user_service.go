// Package service holds business logic. Handlers call services; services call
// repositories. Services never touch HTTP, and repositories never hold logic.
package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/amanuelmr/kuriftu-membership/backend/internal/auth"
	"github.com/amanuelmr/kuriftu-membership/backend/internal/repository"
)

// Sentinel errors let handlers map failures to HTTP status codes without
// depending on the underlying driver.
var (
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound       = errors.New("user not found")
)

type UserService struct {
	q    repository.Querier
	auth *auth.Manager
}

func NewUserService(q repository.Querier, authMgr *auth.Manager) *UserService {
	return &UserService{q: q, auth: authMgr}
}

// SignupInput matches the register payload from api.ts (fname/lname).
type SignupInput struct {
	Fname    string
	Lname    string
	Email    string
	Phone    string
	Password string
}

// Signup creates a user and returns a signed JWT plus the created user.
func (s *UserService) Signup(ctx context.Context, in SignupInput) (string, repository.User, error) {
	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		return "", repository.User{}, err
	}

	user, err := s.q.CreateUser(ctx, repository.CreateUserParams{
		FirstName:    in.Fname,
		LastName:     in.Lname,
		Email:        strings.ToLower(strings.TrimSpace(in.Email)),
		Phone:        in.Phone,
		PasswordHash: hash,
		MembershipID: generateMembershipID(),
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" { // unique_violation
			return "", repository.User{}, ErrEmailTaken
		}
		return "", repository.User{}, fmt.Errorf("create user: %w", err)
	}

	token, err := s.auth.IssueToken(user.ID)
	if err != nil {
		return "", repository.User{}, err
	}
	return token, user, nil
}

// Login verifies credentials and returns a signed JWT plus the user.
func (s *UserService) Login(ctx context.Context, email, password string) (string, repository.User, error) {
	user, err := s.q.GetUserByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", repository.User{}, ErrInvalidCredentials
		}
		return "", repository.User{}, fmt.Errorf("get user: %w", err)
	}
	if !auth.CheckPassword(user.PasswordHash, password) {
		return "", repository.User{}, ErrInvalidCredentials
	}
	token, err := s.auth.IssueToken(user.ID)
	if err != nil {
		return "", repository.User{}, err
	}
	return token, user, nil
}

// GetByID returns a user by id.
func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (repository.User, error) {
	user, err := s.q.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.User{}, ErrUserNotFound
		}
		return repository.User{}, fmt.Errorf("get user: %w", err)
	}
	return user, nil
}

// UpdateInput carries optional profile fields; nil means "leave unchanged".
type UpdateInput struct {
	FirstName *string
	LastName  *string
	Phone     *string
	Avatar    *string
}

// Update applies a partial profile update.
func (s *UserService) Update(ctx context.Context, id uuid.UUID, in UpdateInput) (repository.User, error) {
	user, err := s.q.UpdateUser(ctx, repository.UpdateUserParams{
		FirstName: textOrNull(in.FirstName),
		LastName:  textOrNull(in.LastName),
		Phone:     textOrNull(in.Phone),
		Avatar:    textOrNull(in.Avatar),
		ID:        id,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.User{}, ErrUserNotFound
		}
		return repository.User{}, fmt.Errorf("update user: %w", err)
	}
	return user, nil
}

func textOrNull(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

// generateMembershipID produces a human-friendly membership identifier.
func generateMembershipID() string {
	return "KRF-" + strings.ToUpper(uuid.NewString()[:8])
}
