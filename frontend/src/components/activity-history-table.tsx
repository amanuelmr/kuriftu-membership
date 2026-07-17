'use client'

import { ArrowDownRight, ArrowUpRight, Calendar, Coffee, Hotel, SpadeIcon as Spa } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableError } from "@/components/data-error"
import { usePointsHistory } from "@/lib/hooks"

interface ActivityHistoryTableProps {
  category?: "all" | "points" | "stays" | "dining" | "spa"
  /** Free-text filter applied to the description (case-insensitive). */
  query?: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function withCommas(value: string): string {
  const n = Number(value)
  return isNaN(n) ? value : n.toLocaleString("en-US")
}

const categoryIcons = {
  stays: <Hotel className="h-4 w-4" />,
  dining: <Coffee className="h-4 w-4" />,
  spa: <Spa className="h-4 w-4" />,
  points: <Calendar className="h-4 w-4" />,
}

const categoryColors = {
  stays: "bg-blue-100 text-blue-800 border-blue-200",
  dining: "bg-amber-100 text-amber-800 border-amber-200",
  spa: "bg-purple-100 text-purple-800 border-purple-200",
  points: "bg-emerald-100 text-emerald-800 border-emerald-200",
}

export function ActivityHistoryTable({ category = "all", query = "" }: ActivityHistoryTableProps) {
  const { pointsHistory, isLoading, isError, mutate } = usePointsHistory()

  const columns = category === "all" ? 5 : 4
  const search = query.trim().toLowerCase()
  const activities = (pointsHistory ?? [])
    .filter((a) => category === "all" || a.category === category)
    .filter((a) => !search || a.description.toLowerCase().includes(search))

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            {category === "all" && <TableHead>Category</TableHead>}
            <TableHead>Points</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={columns} className="text-center text-muted-foreground py-8">
                Loading activity…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && isError && (
            <TableError colSpan={columns} message="We couldn't load your activity." onRetry={() => mutate()} />
          )}
          {!isLoading && !isError && activities.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns} className="text-center text-muted-foreground py-8">
                No activity found.
              </TableCell>
            </TableRow>
          )}
          {!isError && activities.map((activity) => {
            const earned = activity.type === "earned"
            const sign = earned ? "+" : "-"
            return (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{formatDate(activity.date)}</TableCell>
                <TableCell>{activity.description}</TableCell>
                {category === "all" && (
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`flex w-fit items-center gap-1 ${
                        categoryColors[activity.category as keyof typeof categoryColors] ?? ""
                      }`}
                    >
                      {categoryIcons[activity.category as keyof typeof categoryIcons]}
                      {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-1">
                    {earned ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-600">{sign}{withCommas(activity.points)}</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-600">{sign}{withCommas(activity.points)}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{activity.amount}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
