package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http/httptest"
	"testing"
)

func sign(body []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

func TestValidWebhookSignature(t *testing.T) {
	body := []byte(`{"tx_ref":"krf-abc"}`)
	secret := "whsec-test"

	r := httptest.NewRequest("POST", "/api/payments/webhook", nil)
	r.Header.Set("Chapa-Signature", sign(body, secret))
	if !validWebhookSignature(body, r, secret) {
		t.Error("valid Chapa-Signature rejected")
	}

	r = httptest.NewRequest("POST", "/api/payments/webhook", nil)
	r.Header.Set("x-chapa-signature", sign(body, secret))
	if !validWebhookSignature(body, r, secret) {
		t.Error("valid x-chapa-signature rejected")
	}

	r = httptest.NewRequest("POST", "/api/payments/webhook", nil)
	r.Header.Set("Chapa-Signature", sign(body, "wrong-secret"))
	if validWebhookSignature(body, r, secret) {
		t.Error("signature from the wrong secret accepted")
	}

	r = httptest.NewRequest("POST", "/api/payments/webhook", nil)
	if validWebhookSignature(body, r, secret) {
		t.Error("missing signature accepted")
	}
}
