package auth

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestHashAndCheckPassword(t *testing.T) {
	hash, err := HashPassword("supersecret1")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if hash == "supersecret1" {
		t.Fatal("hash must not equal plaintext")
	}
	if !CheckPassword(hash, "supersecret1") {
		t.Error("correct password should verify")
	}
	if CheckPassword(hash, "wrongpass") {
		t.Error("wrong password must not verify")
	}
}

func TestTokenRoundTrip(t *testing.T) {
	mgr := NewManager("test-secret", time.Hour)
	id := uuid.New()

	token, err := mgr.IssueToken(id)
	if err != nil {
		t.Fatalf("issue: %v", err)
	}

	got, err := mgr.ParseToken(token)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if got != id {
		t.Errorf("got %s, want %s", got, id)
	}
}

func TestExpiredToken(t *testing.T) {
	mgr := NewManager("test-secret", -time.Hour) // already expired
	token, err := mgr.IssueToken(uuid.New())
	if err != nil {
		t.Fatalf("issue: %v", err)
	}
	if _, err := mgr.ParseToken(token); err == nil {
		t.Error("expired token must fail to parse")
	}
}

func TestWrongSecret(t *testing.T) {
	issuer := NewManager("secret-a", time.Hour)
	verifier := NewManager("secret-b", time.Hour)
	token, _ := issuer.IssueToken(uuid.New())
	if _, err := verifier.ParseToken(token); err == nil {
		t.Error("token signed with different secret must fail")
	}
}
