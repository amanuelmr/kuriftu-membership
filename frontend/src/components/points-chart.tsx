"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"
import { usePointsHistory } from "@/lib/hooks"

interface MonthBucket {
  name: string
  earned: number
  redeemed: number
}

// The last six calendar months (oldest first), each summing that month's
// earned and redeemed points from the real transaction history.
function bucketByMonth(history: { date: string; points: string; type: string }[]): MonthBucket[] {
  const now = new Date()
  const buckets: MonthBucket[] = []
  const index = new Map<string, MonthBucket>()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = { name: d.toLocaleDateString("en-US", { month: "short" }), earned: 0, redeemed: 0 }
    buckets.push(bucket)
    index.set(key, bucket)
  }

  for (const t of history) {
    const d = new Date(t.date)
    if (isNaN(d.getTime())) continue
    const bucket = index.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (!bucket) continue
    const points = Number(t.points) || 0
    if (t.type === "earned") bucket.earned += points
    else if (t.type === "redeemed") bucket.redeemed += points
  }

  return buckets
}

export function PointsChart() {
  const { pointsHistory, isLoading } = usePointsHistory()
  const history = pointsHistory ?? []
  const data = bucketByMonth(history)
  const empty = !isLoading && history.length === 0

  if (empty) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No points activity yet — your earning history will appear here.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        <Bar dataKey="earned" name="Points Earned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="redeemed" name="Points Redeemed" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
