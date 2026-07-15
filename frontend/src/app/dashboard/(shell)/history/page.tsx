'use client'

import { useState } from "react"
import { ArrowDownRight, ArrowUpRight, Calendar, Search } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivityHistoryTable } from "@/components/activity-history-table"
import { ActivitySummary } from "@/components/activity-summary"
import { usePointsBalance, usePointsHistory } from "@/lib/hooks"

const TABS = [
  { value: "all", title: "All Activity", description: "Your complete activity history" },
  { value: "points", title: "Points Activity", description: "Your points earning and redemption history" },
  { value: "stays", title: "Stay History", description: "Your past and upcoming stays" },
  { value: "dining", title: "Dining History", description: "Your restaurant and dining experiences" },
  { value: "spa", title: "Spa & Wellness", description: "Your spa treatments and wellness activities" },
] as const

export default function HistoryPage() {
  const [query, setQuery] = useState("")
  const { pointsHistory } = usePointsHistory()
  const { pointsBalance } = usePointsBalance()

  const history = pointsHistory ?? []
  const totalEarned = history
    .filter((t) => t.type === "earned")
    .reduce((sum, t) => sum + (Number(t.points) || 0), 0)
  const totalRedeemed = history
    .filter((t) => t.type === "redeemed")
    .reduce((sum, t) => sum + (Number(t.points) || 0), 0)
  const totalStays = history.filter((t) => t.category === "stays").length
  const available = pointsBalance?.available ?? 0

  return (
    <>
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Activity History</h1>
      <p className="text-muted-foreground">
        View your complete activity history, including points transactions, stays, and more.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-4">
      <ActivitySummary
        title="Total Points Earned"
        value={totalEarned.toLocaleString()}
        icon={<ArrowUpRight className="h-4 w-4" />}
        iconColor="text-emerald-600"
        bgColor="bg-emerald-50"
        borderColor="border-emerald-200"
      />
      <ActivitySummary
        title="Total Points Redeemed"
        value={totalRedeemed.toLocaleString()}
        icon={<ArrowDownRight className="h-4 w-4" />}
        iconColor="text-amber-600"
        bgColor="bg-amber-50"
        borderColor="border-amber-200"
      />
      <ActivitySummary
        title="Total Stays"
        value={totalStays.toLocaleString()}
        icon={<Calendar className="h-4 w-4" />}
        iconColor="text-blue-600"
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
      />
      <ActivitySummary
        title="Available Points"
        value={available.toLocaleString()}
        icon={<ArrowUpRight className="h-4 w-4" />}
        iconColor="text-red-600"
        bgColor="bg-red-50"
        borderColor="border-red-200"
      />
    </div>

    <div className="relative w-full md:w-[300px]">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search activity..."
        className="pl-8"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search activity"
      />
    </div>

    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all">All Activity</TabsTrigger>
        <TabsTrigger value="points">Points</TabsTrigger>
        <TabsTrigger value="stays">Stays</TabsTrigger>
        <TabsTrigger value="dining">Dining</TabsTrigger>
        <TabsTrigger value="spa">Spa & Wellness</TabsTrigger>
      </TabsList>
      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{tab.title}</CardTitle>
              <CardDescription>{tab.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityHistoryTable category={tab.value} query={query} />
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
    </>
  )
}
