'use client'

import { useState } from "react"
import { Award, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { mutate } from "swr"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useUser, usePointsBalance } from "@/lib/hooks"
import { upgradeMembership, initializePayment } from "@/lib/api"

const TIER_RANK: Record<string, number> = { Basic: 0, Golden: 1, Platinum: 2, Diamond: 3 }

const ALL_TIERS = [
  {
    name: "Golden",
    rank: 1,
    price: "$100",
    color: "amber",
    description: "Perfect for first-time or occasional visitors seeking enhanced experiences.",
    benefits: [
      "10% discount on accommodations",
      "Early check-in when available",
      "Welcome amenity upon arrival",
      "Member-only promotions",
      "Birthday special offer",
      "5% discount at resort restaurants",
    ],
    pointsRequired: 10000,
  },
  {
    name: "Platinum",
    rank: 2,
    price: "$350",
    color: "slate",
    description: "Designed for regular guests who appreciate premium service and exclusive access.",
    benefits: [
      "15% discount on accommodations",
      "Guaranteed late checkout (2 PM)",
      "Complimentary 30-min spa treatment",
      "Room upgrade when available",
      "Priority restaurant reservations",
      "Exclusive access to member events",
      "Dedicated concierge service",
      "10% discount at resort restaurants",
    ],
    pointsRequired: 25000,
  },
  {
    name: "Diamond",
    rank: 3,
    price: "$750",
    color: "purple",
    description: "The ultimate luxury experience for our most valued guests.",
    benefits: [
      "25% discount on accommodations",
      "Guaranteed room upgrade",
      "Complimentary airport transfers",
      "Personalized in-room amenities",
      "Dedicated personal assistant",
      "Exclusive access to private events",
      "Complimentary 60-min spa treatment",
      "20% discount at resort restaurants",
      "Complimentary minibar",
    ],
    pointsRequired: 50000,
  },
]

export function MembershipUpgradeOptions() {
  const { user } = useUser()
  const { pointsBalance } = usePointsBalance()

  const currentTier = user?.membershipTier ?? "Basic"
  const currentPointsNum = pointsBalance?.available ?? 0
  const currentRank = TIER_RANK[currentTier] ?? 0

  // Only tiers above the member's current tier are upgrades.
  const tiers = ALL_TIERS.filter((t) => t.rank > currentRank)

  // Which tier is currently processing (name), and via which flow.
  const [processing, setProcessing] = useState<string | null>(null)

  async function upgradeWithPoints(tierName: string) {
    try {
      setProcessing(tierName)
      await upgradeMembership(tierName)
      await Promise.all([mutate("user"), mutate("points/balance")])
      toast.success(`You're now a ${tierName} member!`)
    } catch {
      toast.error("Upgrade failed. Please try again.")
    } finally {
      setProcessing(null)
    }
  }

  async function purchaseUpgrade(tierName: string, price: string) {
    try {
      setProcessing(tierName)
      const amount = price.replace(/[^0-9.]/g, "")
      const { checkoutUrl } = await initializePayment({
        amount,
        currency: "ETB",
        description: `${tierName} membership upgrade`,
      })
      // Hand off to the Chapa hosted checkout (mock returns a local URL).
      window.location.href = checkoutUrl
    } catch {
      toast.error("Could not start payment. Please try again.")
      setProcessing(null)
    }
  }

  const colorClasses = {
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      heading: "text-amber-800",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
      icon: "text-amber-600",
      progress: "bg-amber-200",
      progressFill: "bg-amber-600",
    },
    slate: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      heading: "text-slate-800",
      button: "bg-slate-700 hover:bg-slate-800 text-white",
      icon: "text-slate-600",
      progress: "bg-slate-200",
      progressFill: "bg-slate-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      heading: "text-purple-800",
      button: "bg-purple-700 hover:bg-purple-800 text-white",
      icon: "text-purple-600",
      progress: "bg-purple-200",
      progressFill: "bg-purple-600",
    },
  }

  return (
    <div className="space-y-6">
      {tiers.length === 0 ? (
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800">
          <CardContent className="flex items-center gap-3 p-6">
            <Award className="h-8 w-8 text-purple-700 dark:text-purple-300" />
            <div>
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                You&apos;re at our highest tier — {currentTier}
              </h3>
              <p className="text-muted-foreground">There are no higher tiers to upgrade to. Enjoy every benefit.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const canAfford = currentPointsNum >= tier.pointsRequired
            const progressPercentage = Math.min(Math.round((currentPointsNum / tier.pointsRequired) * 100), 100)

            return (
              <Card
                key={tier.name}
                className={`overflow-hidden transition-all ${colorClasses[tier.color as keyof typeof colorClasses].bg} ${
                  colorClasses[tier.color as keyof typeof colorClasses].border
                }`}
              >
                <CardHeader className={`pb-2 ${colorClasses[tier.color as keyof typeof colorClasses].heading}`}>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    <CardTitle className="font-serif text-xl">{tier.name}</CardTitle>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-2xl font-bold">
                    {tier.price}
                    <span className="text-sm font-normal text-muted-foreground"> / year</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>
                        {currentPointsNum.toLocaleString()} / {tier.pointsRequired.toLocaleString()} points
                      </span>
                      <span className="font-medium">{progressPercentage}%</span>
                    </div>
                    <Progress
                      value={progressPercentage}
                      className={`h-2 ${colorClasses[tier.color as keyof typeof colorClasses].progress}`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          colorClasses[tier.color as keyof typeof colorClasses].progressFill
                        }`}
                      />
                    </Progress>
                  </div>

                  <ul className="space-y-2">
                    {tier.benefits.slice(0, 4).map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check
                          className={`h-4 w-4 mt-0.5 ${colorClasses[tier.color as keyof typeof colorClasses].icon}`}
                        />
                        <span>{benefit}</span>
                      </li>
                    ))}
                    {tier.benefits.length > 4 && (
                      <li className="text-sm text-muted-foreground">+{tier.benefits.length - 4} more benefits</li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full ${colorClasses[tier.color as keyof typeof colorClasses].button}`}
                    disabled={processing !== null}
                    onClick={() =>
                      canAfford ? upgradeWithPoints(tier.name) : purchaseUpgrade(tier.name, tier.price)
                    }
                  >
                    {processing === tier.name && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {canAfford ? "Upgrade with Points" : "Purchase Upgrade"}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upgrade Information</CardTitle>
          <CardDescription>Important details about membership upgrades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-2">Points Upgrade</h3>
            <p className="text-sm text-muted-foreground">
              You can use your accumulated points to upgrade your membership tier. Points used for upgrades will be
              deducted from your total balance. Upgrades are effective immediately and valid for one year from the
              upgrade date.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-2">Direct Purchase</h3>
            <p className="text-sm text-muted-foreground">
              You can purchase a membership upgrade directly. The cost will be prorated based on your current
              membership&apos;s remaining time. Your new membership will expire one year from your original membership start date.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-2">Downgrade Policy</h3>
            <p className="text-sm text-muted-foreground">
              You can downgrade your membership at renewal time. No refunds are provided for downgrades before the
              renewal date. All benefits of your current tier remain active until your membership expires.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
