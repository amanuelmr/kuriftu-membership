'use client'

import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePointsHistory } from "@/lib/hooks"

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

export function PointsHistoryTable() {
  const { pointsHistory, isLoading } = usePointsHistory()
  const transactions = pointsHistory ?? []

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Points</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Loading history…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No points activity yet.
              </TableCell>
            </TableRow>
          )}
          {transactions.map((transaction) => {
            const earned = transaction.type === "earned"
            const sign = earned ? "+" : "-"
            const category = transaction.category
              ? transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)
              : ""
            return (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{category}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {earned ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-600">{sign}{withCommas(transaction.points)}</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-600">{sign}{withCommas(transaction.points)}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{withCommas(transaction.balance)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
