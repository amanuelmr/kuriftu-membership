'use client'

import { Calendar, Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingCard } from "@/components/booking-card"
import { DateRangePicker } from "@/components/date-range-picker"
import { BookingFilters } from "@/components/booking-filters"
import { DataError } from "@/components/data-error"
import { useBookings } from "@/lib/hooks"
import type { Booking } from "@/lib/api"

// A booking is "upcoming" while confirmed/pending, and lands in past/cancelled
// once completed/cancelled.
const TABS: Record<string, Booking["status"][]> = {
  upcoming: ["confirmed", "pending"],
  past: ["completed"],
  cancelled: ["cancelled"],
}

function BookingList({
  bookings,
  isLoading,
  isError,
  onRetry,
}: {
  bookings: Booking[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  if (isLoading) {
    return <p className="text-muted-foreground py-8 text-center">Loading bookings…</p>
  }
  if (isError) {
    return <DataError message="We couldn't load your bookings." onRetry={onRetry} />
  }
  if (bookings.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">No bookings here yet.</p>
  }
  return (
    <div className="grid gap-6">
      {bookings.map((b) => (
        <BookingCard
          key={b.id}
          id={b.id}
          image={b.image}
          title={b.title}
          location={b.location}
          checkIn={b.checkIn}
          checkOut={b.checkOut}
          guests={b.guests}
          status={b.status}
          price={b.price}
          amenities={b.amenities}
        />
      ))}
    </div>
  )
}

export default function BookingsPage() {
  const { bookings, isLoading, isError, mutate } = useBookings()
  const all: Booking[] = bookings ?? []
  const byTab = (tab: keyof typeof TABS) => all.filter((b) => TABS[tab].includes(b.status))

  return (
    <>
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl font-bold tracking-tight">My Bookings</h1>
      <p className="text-muted-foreground">View and manage your reservations at Kuriftu Resort.</p>
    </div>

    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search bookings..." className="pl-8" />
        </div>
        <DateRangePicker />
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <BookingFilters />
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </div>
    </div>

    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming" className="mt-6">
        <BookingList bookings={byTab("upcoming")} isLoading={isLoading} isError={!!isError} onRetry={() => mutate()} />
      </TabsContent>
      <TabsContent value="past" className="mt-6">
        <BookingList bookings={byTab("past")} isLoading={isLoading} isError={!!isError} onRetry={() => mutate()} />
      </TabsContent>
      <TabsContent value="cancelled" className="mt-6">
        <BookingList bookings={byTab("cancelled")} isLoading={isLoading} isError={!!isError} onRetry={() => mutate()} />
      </TabsContent>
    </Tabs>
    </>
  )
}
