import { ArrowDownRight, ArrowUpRight, Calendar, Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangePicker } from "@/components/date-range-picker"
import { ActivityHistoryTable } from "@/components/activity-history-table"
import { ActivitySummary } from "@/components/activity-summary"

export default function HistoryPage() {
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
        value="24,850"
        change="+1,780"
        changeType="increase"
        icon={<ArrowUpRight className="h-4 w-4" />}
        iconColor="text-emerald-600"
        bgColor="bg-emerald-50"
        borderColor="border-emerald-200"
      />
      <ActivitySummary
        title="Total Points Redeemed"
        value="12,400"
        change="+2,500"
        changeType="increase"
        icon={<ArrowDownRight className="h-4 w-4" />}
        iconColor="text-amber-600"
        bgColor="bg-amber-50"
        borderColor="border-amber-200"
      />
      <ActivitySummary
        title="Total Stays"
        value="18"
        change="+3"
        changeType="increase"
        icon={<Calendar className="h-4 w-4" />}
        iconColor="text-blue-600"
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
      />
      <ActivitySummary
        title="Available Points"
        value="12,450"
        change="-720"
        changeType="decrease"
        icon={<ArrowDownRight className="h-4 w-4" />}
        iconColor="text-red-600"
        bgColor="bg-red-50"
        borderColor="border-red-200"
      />
    </div>

    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search activity..." className="pl-8" />
        </div>
        <DateRangePicker />
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
        <Button>Export History</Button>
      </div>
    </div>

    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all">All Activity</TabsTrigger>
        <TabsTrigger value="points">Points</TabsTrigger>
        <TabsTrigger value="stays">Stays</TabsTrigger>
        <TabsTrigger value="dining">Dining</TabsTrigger>
        <TabsTrigger value="spa">Spa & Wellness</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>All Activity</CardTitle>
            <CardDescription>Your complete activity history</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHistoryTable />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="points" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Points Activity</CardTitle>
            <CardDescription>Your points earning and redemption history</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHistoryTable category="points" />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="stays" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Stay History</CardTitle>
            <CardDescription>Your past and upcoming stays</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHistoryTable category="stays" />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="dining" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Dining History</CardTitle>
            <CardDescription>Your restaurant and dining experiences</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHistoryTable category="dining" />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="spa" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Spa & Wellness</CardTitle>
            <CardDescription>Your spa treatments and wellness activities</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHistoryTable category="spa" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </>
  )
}
