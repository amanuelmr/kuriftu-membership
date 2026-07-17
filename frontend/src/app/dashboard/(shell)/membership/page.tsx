'use client'

import { Award, Calendar, CreditCard, Gift, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MembershipCard } from "@/components/membership-card"
import { MembershipBenefits } from "@/components/membership-benefits"
import { MembershipHistory } from "@/components/membership-history"
import { MembershipUpgradeOptions } from "@/components/membership-upgrade-options"
import { DataError } from "@/components/data-error"
import { useUser } from "@/lib/hooks"

// Annual fee by tier (used for the "Next Payment" estimate).
const TIER_FEE: Record<string, string> = {
  Basic: "$0.00",
  Golden: "$100.00",
  Platinum: "$350.00",
  Diamond: "$750.00",
}

export default function MembershipPage() {
  const { user, isError, mutate } = useUser()

  const tier = user?.membershipTier ?? "Basic"
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "Member"

  const memberSince = user?.memberSince ? new Date(user.memberSince) : null
  const expiry = user?.expiryDate ? new Date(user.expiryDate) : null
  const now = new Date()

  const sinceLabel = memberSince
    ? memberSince.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—"
  const yearsOfLoyalty = memberSince ? Math.max(0, now.getFullYear() - memberSince.getFullYear()) : 0
  const daysToRenewal = expiry ? Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000)) : null
  const renewalPct = daysToRenewal !== null ? Math.min(100, Math.round((daysToRenewal / 365) * 100)) : 0

  return (
    <>
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Membership</h1>
      <p className="text-muted-foreground">
        Manage your membership status, view benefits, and explore upgrade options.
      </p>
    </div>

    {isError && (
      <DataError message="We couldn't load your membership details." onRetry={() => mutate()} />
    )}

    <div className="grid gap-6 md:grid-cols-3">
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-purple-900 dark:text-purple-100">Current Tier</CardTitle>
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

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950 dark:to-amber-900 dark:border-amber-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-900 dark:text-amber-100">Member Since</CardTitle>
          <CardDescription>Membership duration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-amber-700 dark:text-amber-300" />
            <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{sinceLabel}</div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium">
              {yearsOfLoyalty} {yearsOfLoyalty === 1 ? "year" : "years"}
            </span>{" "}
            of loyalty with Kuriftu Resort
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-emerald-900 dark:text-emerald-100">Next Payment</CardTitle>
          <CardDescription>Annual membership fee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {TIER_FEE[tier] ?? "$0.00"}
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Due on{" "}
            <span className="font-medium">
              {expiry ? expiry.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Your Digital Membership Card</CardTitle>
        <CardDescription>Present this card when checking in or dining at our resort</CardDescription>
      </CardHeader>
      <CardContent>
        <MembershipCard
          name={fullName}
          memberId={user?.membershipId ?? "—"}
          tier={tier}
          since={memberSince ? memberSince.getFullYear().toString() : "—"}
          expiryDate={
            expiry ? expiry.toLocaleDateString("en-US", { month: "2-digit", year: "numeric" }) : "—"
          }
        />
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="gap-2">
          <Gift className="h-4 w-4" />
          Send as Gift
        </Button>
        <Button className="ml-auto gap-2">
          <Info className="h-4 w-4" />
          View Full Details
        </Button>
      </CardFooter>
    </Card>

    <Tabs defaultValue="upgrade" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="upgrade">Upgrade Options</TabsTrigger>
        <TabsTrigger value="benefits">Benefits</TabsTrigger>
        <TabsTrigger value="history">Membership History</TabsTrigger>
      </TabsList>
      <TabsContent value="upgrade" className="mt-6">
        <MembershipUpgradeOptions />
      </TabsContent>
      <TabsContent value="benefits" className="mt-6">
        <MembershipBenefits />
      </TabsContent>
      <TabsContent value="history" className="mt-6">
        <MembershipHistory />
      </TabsContent>
    </Tabs>
    </>
  )
}
