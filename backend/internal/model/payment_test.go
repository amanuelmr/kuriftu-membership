package model

import "testing"

func TestDetectCardBrand(t *testing.T) {
	cases := map[string]string{
		"4242 4242 4242 4242": "visa",
		"5500-0000-0000-0004": "mastercard",
		"340000000000009":     "amex",
		"6011000000000004":    "discover",
	}
	for pan, want := range cases {
		if got := DetectCardBrand(pan); got != want {
			t.Errorf("DetectCardBrand(%q) = %q, want %q", pan, got, want)
		}
	}
}

func TestLastFourNeverExposesFullPAN(t *testing.T) {
	if got := LastFour("4242 4242 4242 1234"); got != "1234" {
		t.Errorf("LastFour = %q, want 1234", got)
	}
	if got := LastFour("123"); got != "123" {
		t.Errorf("short LastFour = %q, want 123", got)
	}
}
