package service

import "errors"

// ErrInvalidUpgrade rejects upgrade requests whose target tier is unknown or
// not strictly above the member's current tier.
var ErrInvalidUpgrade = errors.New("invalid membership upgrade")

// TierOffer is the authoritative price of a membership tier. Clients never
// choose these values: purchased upgrades are charged PriceETB via Chapa and
// points-funded upgrades deduct PointsRequired.
type TierOffer struct {
	Tier           string
	PriceETB       string
	PointsRequired int64
}

// tierRank orders tiers so an upgrade can be validated as strictly upward.
var tierRank = map[string]int{
	"Basic":    0,
	"Golden":   1,
	"Platinum": 2,
	"Diamond":  3,
}

// tierCatalog is the single source of truth for upgrade pricing. The ETB
// prices are launch placeholders pending final business pricing.
var tierCatalog = map[string]TierOffer{
	"Golden":   {Tier: "Golden", PriceETB: "5000", PointsRequired: 10000},
	"Platinum": {Tier: "Platinum", PriceETB: "12500", PointsRequired: 25000},
	"Diamond":  {Tier: "Diamond", PriceETB: "25000", PointsRequired: 50000},
}

// TierOffers lists the purchasable tiers in ascending rank, for the catalog
// endpoint.
func TierOffers() []TierOffer {
	return []TierOffer{tierCatalog["Golden"], tierCatalog["Platinum"], tierCatalog["Diamond"]}
}

// upgradeOffer validates that target is a purchasable tier strictly above
// current and returns its catalog entry.
func upgradeOffer(current, target string) (TierOffer, error) {
	offer, ok := tierCatalog[target]
	if !ok {
		return TierOffer{}, ErrInvalidUpgrade
	}
	currentRank, ok := tierRank[current]
	if !ok {
		currentRank = 0
	}
	if tierRank[target] <= currentRank {
		return TierOffer{}, ErrInvalidUpgrade
	}
	return offer, nil
}
