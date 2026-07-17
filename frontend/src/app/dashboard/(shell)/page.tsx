'use client'

import { Award, Gift, Hotel, Ticket, TrendingUp, Utensils } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MembershipCard } from "@/components/membership-card"
import { ReservationCard } from "@/components/reservation-card"
import { ActivityItem } from "@/components/activity-item"
import { OfferCard } from "@/components/offer-card"
import { PointsChart } from "@/components/points-chart"
import { DataError } from "@/components/data-error"
import { useUser, usePointsBalance, useBookings, usePointsHistory, useOffers } from "@/lib/hooks"

function shortDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export default function DashboardPage() {
  const { user, isError: userError, mutate: mutateUser } = useUser()
  const { pointsBalance, isError: balanceError, mutate: mutateBalance } = usePointsBalance()
  const { bookings } = useBookings()
  const { pointsHistory } = usePointsHistory()
  const { offers } = useOffers()

  // The greeting, membership card, and tier all hang off the core profile +
  // balance fetches — if those fail, say so instead of showing a blank shell.
  const coreError = userError || balanceError

  const firstName = user?.firstName ?? "there"
  const points = pointsBalance?.available ?? 0
  const lifetime = pointsBalance?.lifetime ?? 0
  const tier = user?.membershipTier ?? "Basic"

  // Renewal countdown derived from the real expiry date.
  const expiry = user?.expiryDate ? new Date(user.expiryDate) : null
  const daysToRenewal = expiry ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86_400_000)) : null
  const renewalPct = daysToRenewal !== null ? Math.min(100, Math.round((daysToRenewal / 365) * 100)) : 0

  const upcoming = (bookings ?? []).filter((b) => b.status === "confirmed" || b.status === "pending").slice(0, 2)
  const recentActivity = (pointsHistory ?? []).slice(0, 5)
  const topOffers = (offers ?? []).slice(0, 2)

  return (
    <>
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
      <p className="text-muted-foreground">
        Manage your membership, track your points, and explore exclusive benefits.
      </p>
    </div>

    {coreError && (
      <DataError
        message="We couldn't load your membership details. Some information below may be missing."
        onRetry={() => {
          mutateUser()
          mutateBalance()
        }}
      />
    )}

    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950 dark:to-amber-900 dark:border-amber-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-900 dark:text-amber-100">Total Points</CardTitle>
          <CardDescription>Your current points balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-amber-700 dark:text-amber-300">{points.toLocaleString()}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            <TrendingUp className="inline h-4 w-4 mr-1 text-emerald-600" />
            <span className="text-emerald-600 font-medium">{lifetime.toLocaleString()}</span> lifetime points
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-purple-900 dark:text-purple-100">Membership Tier</CardTitle>
          <CardDescription>{tier} Member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-700 dark:text-purple-300" />
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">{tier}</div>
          </div>
          {daysToRenewal !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Renewal in {daysToRenewal} days</span>
                <span className="font-medium">{renewalPct}%</span>
              </div>
              <Progress value={renewalPct} className="h-2 bg-purple-200 dark:bg-purple-800">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-700 dark:from-purple-400 dark:to-purple-600 rounded-full" />
              </Progress>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Your Digital Membership Card</CardTitle>
          <CardDescription>Present this card when checking in or dining at our resort</CardDescription>
        </CardHeader>
        <CardContent>
          <MembershipCard
            name={user ? `${user.firstName} ${user.lastName}`.trim() : "Member"}
            memberId={user?.membershipId ?? "—"}
            tier={tier}
            since={user?.memberSince ? new Date(user.memberSince).getFullYear().toString() : "—"}
            expiryDate={
              user?.expiryDate
                ? new Date(user.expiryDate).toLocaleDateString("en-US", { month: "2-digit", year: "numeric" })
                : "—"
            }
          />
        </CardContent>
      </Card>

      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used services</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto flex flex-col items-center justify-center py-4 px-2 gap-2 border-dashed hover:border-primary hover:bg-primary/5"
          >
            <Hotel className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Book Stay</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex flex-col items-center justify-center py-4 px-2 gap-2 border-dashed hover:border-primary hover:bg-primary/5"
          >
            <Utensils className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Reserve Dining</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex flex-col items-center justify-center py-4 px-2 gap-2 border-dashed hover:border-primary hover:bg-primary/5"
          >
            <Gift className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Redeem Points</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex flex-col items-center justify-center py-4 px-2 gap-2 border-dashed hover:border-primary hover:bg-primary/5"
          >
            <Ticket className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Special Offers</span>
          </Button>
        </CardContent>
      </Card>
    </div>

    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="upcoming">Upcoming Stays</TabsTrigger>
        <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        <TabsTrigger value="offers">Exclusive Offers</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming" className="mt-6">
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No upcoming stays.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {upcoming.map((b) => (
              <ReservationCard
                key={b.id}
                image={b.image}
                title={b.title}
                dates={`${shortDate(b.checkIn)} - ${shortDate(b.checkOut)}`}
                status={capitalize(b.status) as "Confirmed" | "Pending" | "Cancelled"}
                guests={b.guests}
                amenities={b.amenities}
              />
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="activity" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Points Activity</CardTitle>
            <CardDescription>Your recent points transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No points activity yet.</p>
            ) : (
              recentActivity.map((t) => (
                <ActivityItem
                  key={t.id}
                  title={t.description}
                  date={shortDate(t.date)}
                  points={`${t.type === "earned" ? "+" : "-"}${Number(t.points).toLocaleString()}`}
                  type={t.type}
                />
              ))
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Activity
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="offers" className="mt-6">
        {topOffers.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No offers available right now.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {topOffers.map((o) => (
              <OfferCard
                key={o.id}
                image={o.image}
                title={o.title}
                description={o.description}
                expiry={`Valid until ${shortDate(o.expiry)}`}
                discount={o.discount}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>

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
    </>
  )
}
