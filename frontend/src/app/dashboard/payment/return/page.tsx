'use client'

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { mutate } from "swr"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { verifyPayment } from "@/lib/api"

type Status = "verifying" | "success" | "failed" | "error"

function PaymentReturnInner() {
  const router = useRouter()
  const params = useSearchParams()
  const txRef = params.get("tx_ref") || ""
  const [status, setStatus] = useState<Status>("verifying")
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // guard against double-invocation in dev strict mode
    ran.current = true

    if (!txRef) {
      setStatus("error")
      return
    }
    verifyPayment(txRef)
      .then(async (payment) => {
        if (payment.status === "completed") {
          setStatus("success")
          // Refresh anything a purchase may have changed (tier, balance).
          await Promise.all([mutate("user"), mutate("points/balance"), mutate("payments/history")])
        } else {
          setStatus("failed")
        }
      })
      .catch(() => setStatus("error"))
  }, [txRef])

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <DashboardHeader />
      <div className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2">
              {status === "verifying" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
              {status === "success" && <CheckCircle2 className="h-12 w-12 text-emerald-600" />}
              {(status === "failed" || status === "error") && <XCircle className="h-12 w-12 text-destructive" />}
            </div>
            <CardTitle className="font-serif text-2xl">
              {status === "verifying" && "Confirming your payment…"}
              {status === "success" && "Payment successful"}
              {status === "failed" && "Payment not completed"}
              {status === "error" && "Couldn't verify payment"}
            </CardTitle>
            <CardDescription>
              {status === "verifying" && "Please wait while we confirm your transaction with Chapa."}
              {status === "success" && "Your payment went through and your account has been updated."}
              {status === "failed" && "The transaction was not completed. You have not been charged."}
              {status === "error" && "We couldn't confirm this transaction. If you were charged, contact support."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {status !== "verifying" && (
              <>
                <Button onClick={() => router.push("/dashboard/membership")}>Go to Membership</Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={null}>
      <PaymentReturnInner />
    </Suspense>
  )
}
