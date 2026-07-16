'use client'

import { Award } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePaymentHistory } from "@/lib/hooks"

// Payments are processed through Chapa's hosted checkout, so cards are entered
// on Chapa's page and never stored here — this screen is read-only history.

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  upcoming: "bg-amber-100 text-amber-800 border-amber-200",
  redeemed: "bg-blue-100 text-blue-800 border-blue-200",
  failed: "bg-red-100 text-red-800 border-red-200",
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function PaymentsPage() {
  const { paymentHistory, isLoading } = usePaymentHistory()
  const payments = paymentHistory ?? []

  return (
    <>
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Payments</h1>
      <p className="text-muted-foreground">
        Your payment history. Payments are processed securely through Chapa at checkout.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>A record of your transactions with Kuriftu Resort</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Loading payments…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No payments yet.
                  </TableCell>
                </TableRow>
              )}
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{formatDate(p.date)}</TableCell>
                  <TableCell>{p.description || "Payment"}</TableCell>
                  <TableCell>{p.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_STYLES[p.status] ?? ""}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{p.amount} ETB</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-muted/40">
      <CardContent className="flex items-start gap-3 p-6">
        <Award className="h-6 w-6 text-primary mt-0.5" />
        <div>
          <h3 className="font-medium">How payments work</h3>
          <p className="text-sm text-muted-foreground mt-1">
            When you upgrade your membership or make a purchase, you&apos;re taken to Chapa&apos;s secure
            checkout to pay. We never store your card details — only a record of the transaction appears here.
          </p>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
