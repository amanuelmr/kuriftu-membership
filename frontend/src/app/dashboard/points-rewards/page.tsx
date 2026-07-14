'use client'
import { useState } from "react"
import { Award, ShoppingBag, Hotel, Utensils, SpadeIcon as Spa, Users } from "lucide-react"
import { toast } from "sonner"
import { mutate } from "swr"

import { usePointsBalance, useUser } from "@/lib/hooks"
import { upgradeMembership, initializePayment } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardNav } from "@/components/dashboard-nav"
import { PointsChart } from "@/components/points-chart"
import { PointsHistoryTable } from "@/components/points-history-table"
import { MembershipUpgradeCard } from "@/components/membership-upgrade-card"
import { ProductCard } from "@/components/product-card"

// Tier ladder. Only tiers ranked ABOVE the member's current tier are offered
// as upgrades (a Diamond member sees none — they're already at the top).
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

  const points = pointsBalance?.available ?? 0
  const lifetime = pointsBalance?.lifetime ?? 0
  const tier = user?.membershipTier ?? "Basic"

  const currentRank = TIER_RANK[tier] ?? 0
  const upgradeOptions = UPGRADE_TIERS.filter((t) => t.rank > currentRank)

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

  async function purchaseUpgrade(tierName: string, pointsRequired: number) {
    try {
      setProcessing(tierName)
      const { checkoutUrl } = await initializePayment({
        amount: String(pointsRequired),
        currency: "ETB",
        description: `${tierName} membership upgrade`,
        purpose: "membership_upgrade",
        targetTier: tierName,
      })
      window.location.href = checkoutUrl
    } catch {
      toast.error("Could not start payment. Please try again.")
      setProcessing(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <DashboardHeader />
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr] xl:grid-cols-[300px_1fr] py-8">
        <DashboardNav />
        <main className="flex flex-col gap-8">
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
                {upgradeOptions.length === 0 ? (
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800">
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
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {upgradeOptions.map((t) => (
                      <MembershipUpgradeCard
                        key={t.tier}
                        tier={t.tier}
                        pointsRequired={t.pointsRequired.toLocaleString()}
                        currentPoints={points.toLocaleString()}
                        benefits={t.benefits}
                        color={t.color}
                        canAfford={points >= t.pointsRequired}
                        isProcessing={processing === t.tier}
                        onUpgrade={() => upgradeWithPoints(t.tier)}
                        onPurchase={() => purchaseUpgrade(t.tier, t.pointsRequired)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  Products & Experiences
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <ProductCard
                    image="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=8"
                    title="Luxury Spa Package"
                    description="90-minute signature massage with aromatherapy and facial treatment."
                    pointsRequired="5,000"
                    currentPoints="12,450"
                    canAfford={true}
                  />
                  <ProductCard
                    image="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                    title="Fine Dining Experience"
                    description="5-course tasting menu with wine pairing for two at our signature restaurant."
                    pointsRequired="7,500"
                    currentPoints="12,450"
                    canAfford={true}
                  />
                  <ProductCard
                    image="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                    title="Private Lake Excursion"
                    description="3-hour private boat tour of Lake Bishoftu with champagne and snacks."
                    pointsRequired="10,000"
                    currentPoints="12,450"
                    canAfford={true}
                  />
                  <ProductCard
                    image="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                    title="Free Night Stay"
                    description="One complimentary night in a Deluxe Room with breakfast included."
                    pointsRequired="15,000"
                    currentPoints="12,450"
                    canAfford={false}
                  />
                  <ProductCard
                    image="https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                    title="Kuriftu Luxury Bathrobe"
                    description="Premium cotton bathrobe with Kuriftu Resort logo embroidery."
                    pointsRequired="3,500"
                    currentPoints="12,450"
                    canAfford={true}
                  />
                  <ProductCard
                    image="https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                    title="Airport Transfer"
                    description="Luxury vehicle airport transfer service (one-way) with refreshments."
                    pointsRequired="2,000"
                    currentPoints="12,450"
                    canAfford={true}
                  />
                </div>
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
        </main>
      </div>
    </div>
  )
}
