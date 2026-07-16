'use client'
import { useState } from "react"
import { Award, ShoppingBag, Hotel, Utensils, SpadeIcon as Spa, Users } from "lucide-react"
import { toast } from "sonner"
import { mutate } from "swr"

import { usePointsBalance, useRewards, useUser } from "@/lib/hooks"
import { upgradeMembership, initializePayment, redeemReward } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PointsChart } from "@/components/points-chart"
import { PointsHistoryTable } from "@/components/points-history-table"
import { MembershipUpgradeCard } from "@/components/membership-upgrade-card"
import { ProductCard } from "@/components/product-card"

// Tier ladder. Every purchasable tier is always shown; its rank vs. the
// member's current tier decides whether it reads as owned, current, or an
// available upgrade (we never hide the ones they already hold).
const TIER_RANK: Record<string, number> = { Basic: 0, Golden: 1, Platinum: 2, Diamond: 3 }

const UPGRADE_TIERS = [
  {
    tier: "Golden",
    rank: 1,
    pointsRequired: 10000,
    color: "amber" as const,
    benefits: [
      "10% discount on accommodations",
      "Early check-in when available",
      "Welcome amenity upon arrival",
      "5% discount at resort restaurants",
    ],
  },
  {
    tier: "Platinum",
    rank: 2,
    pointsRequired: 25000,
    color: "slate" as const,
    benefits: [
      "15% discount on accommodations",
      "Guaranteed late checkout",
      "Complimentary spa treatment",
      "Room upgrade when available",
      "10% discount at resort restaurants",
    ],
  },
  {
    tier: "Diamond",
    rank: 3,
    pointsRequired: 50000,
    color: "purple" as const,
    benefits: [
      "25% discount on accommodations",
      "Guaranteed room upgrade",
      "Complimentary airport transfers",
      "Dedicated personal assistant",
      "20% discount at resort restaurants",
    ],
  },
]

export default function PointsPage() {
  const { pointsBalance } = usePointsBalance()
  const { user } = useUser()
  const { rewards, isLoading: rewardsLoading } = useRewards()

  const points = pointsBalance?.available ?? 0
  const lifetime = pointsBalance?.lifetime ?? 0
  const tier = user?.membershipTier ?? "Basic"

  const currentRank = TIER_RANK[tier] ?? 0
  const atHighestTier = currentRank >= TIER_RANK.Diamond

  const [processing, setProcessing] = useState<string | null>(null)
  const [redeeming, setRedeeming] = useState<string | null>(null)

  async function redeem(rewardId: string, title: string) {
    try {
      setRedeeming(rewardId)
      await redeemReward(rewardId)
      await Promise.all([mutate("points/balance"), mutate("points/history")])
      toast.success(`Redeemed: ${title}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not redeem this reward.")
    } finally {
      setRedeeming(null)
    }
  }

  async function upgradeWithPoints(tierName: string) {
    try {
      setProcessing(tierName)
      await upgradeMembership(tierName)
      await Promise.all([mutate("user"), mutate("points/balance"), mutate("points/history")])
      toast.success(`You're now a ${tierName} member!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upgrade failed. Please try again.")
    } finally {
      setProcessing(null)
    }
  }

  // The backend prices upgrades from its tier catalog; we only say which
  // tier we want.
  async function purchaseUpgrade(tierName: string) {
    try {
      setProcessing(tierName)
      const { checkoutUrl } = await initializePayment({
        purpose: "membership_upgrade",
        targetTier: tierName,
      })
      if (!checkoutUrl) throw new Error("No checkout URL returned")
      window.location.href = checkoutUrl
    } catch {
      toast.error("Could not start payment. Please try again.")
      setProcessing(null)
    }
  }

  return (
    <>
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Points & Rewards</h1>
      <p className="text-muted-foreground">
        Track your points, view your history, and redeem for rewards or membership upgrades.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-3">
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950 dark:to-amber-900 dark:border-amber-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-900 dark:text-amber-100">Available Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-amber-700 dark:text-amber-300">{points.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-emerald-900 dark:text-emerald-100">Lifetime Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">{lifetime.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-purple-900 dark:text-purple-100">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-700 dark:text-purple-300" />
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">{tier}</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Points History</CardTitle>
        <CardDescription>Your points earning and redemption over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <PointsChart />
        </div>
      </CardContent>
    </Card>

    <Tabs defaultValue="redeem" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="redeem">Redeem Points</TabsTrigger>
        <TabsTrigger value="history">Points History</TabsTrigger>
        <TabsTrigger value="earning">Earning Opportunities</TabsTrigger>
      </TabsList>
      <TabsContent value="redeem" className="mt-6 space-y-8">
        <div>
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Upgrade Your Membership
          </h2>
          {atHighestTier && (
            <Card className="mb-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800">
              <CardContent className="flex items-center gap-3 p-6">
                <Award className="h-8 w-8 text-purple-700 dark:text-purple-300" />
                <div>
                  <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                    You&apos;re at our highest tier — {tier}
                  </h3>
                  <p className="text-muted-foreground">
                    You already enjoy every membership benefit Kuriftu offers.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {UPGRADE_TIERS.map((t) => (
              <MembershipUpgradeCard
                key={t.tier}
                tier={t.tier}
                pointsRequired={t.pointsRequired.toLocaleString()}
                currentPoints={points.toLocaleString()}
                benefits={t.benefits}
                color={t.color}
                canAfford={points >= t.pointsRequired}
                current={t.rank === currentRank}
                owned={t.rank < currentRank}
                isProcessing={processing === t.tier}
                onUpgrade={() => upgradeWithPoints(t.tier)}
                onPurchase={() => purchaseUpgrade(t.tier)}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Products & Experiences
          </h2>
          {rewardsLoading ? (
            <p className="text-muted-foreground py-8 text-center">Loading rewards…</p>
          ) : (rewards ?? []).length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No rewards available right now.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(rewards ?? []).map((reward) => {
                const required = Number(reward.pointsRequired) || 0
                return (
                  <ProductCard
                    key={reward.id}
                    image={reward.image}
                    title={reward.title}
                    description={reward.description}
                    pointsRequired={required.toLocaleString()}
                    currentPoints={points.toLocaleString()}
                    canAfford={points >= required}
                    isRedeeming={redeeming === reward.id}
                    onRedeem={() => redeem(reward.id, reward.title)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </TabsContent>
      <TabsContent value="history" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Points Transaction History</CardTitle>
            <CardDescription>Detailed record of your points earned and redeemed</CardDescription>
          </CardHeader>
          <CardContent>
            <PointsHistoryTable />
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Download Transaction History
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="earning" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Ways to Earn Points</CardTitle>
            <CardDescription>Maximize your points earning potential</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Hotel className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Hotel Stays</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Earn 10 points per $1 spent on room rates and resort fees.
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Membership Bonus:</span>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Basic Member: 1x points (10 points per $1)</li>
                      <li>Golden Member: 1.5x points (15 points per $1)</li>
                      <li>Platinum Member: 2x points (20 points per $1)</li>
                      <li>Diamond Member: 2.5x points (25 points per $1)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Utensils className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Dining</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Earn 5 points per $1 spent at any Kuriftu Resort restaurant or bar.
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Membership Bonus:</span>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Basic Member: 1x points (5 points per $1)</li>
                      <li>Golden Member: 1.5x points (7.5 points per $1)</li>
                      <li>Platinum Member: 2x points (10 points per $1)</li>
                      <li>Diamond Member: 2.5x points (12.5 points per $1)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Spa className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Spa & Wellness</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Earn 8 points per $1 spent on spa treatments and wellness activities.
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Membership Bonus:</span>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Basic Member: 1x points (8 points per $1)</li>
                      <li>Golden Member: 1.5x points (12 points per $1)</li>
                      <li>Platinum Member: 2x points (16 points per $1)</li>
                      <li>Diamond Member: 2.5x points (20 points per $1)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Referrals</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Earn 1,000 bonus points for each friend who joins and completes their first stay.
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Membership Bonus:</span>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Basic Member: 1,000 points per referral</li>
                      <li>Golden Member: 1,500 points per referral</li>
                      <li>Platinum Member: 2,000 points per referral</li>
                      <li>Diamond Member: 2,500 points per referral</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </>
  )
}
