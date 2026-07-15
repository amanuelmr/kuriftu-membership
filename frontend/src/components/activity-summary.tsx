import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ActivitySummaryProps {
  title: string
  value: string
  change?: string
  changeType?: "increase" | "decrease"
  icon: React.ReactNode
  iconColor: string
  bgColor: string
  borderColor: string
}

export function ActivitySummary({
  title,
  value,
  change,
  changeType,
  icon,
  iconColor,
  bgColor,
  borderColor,
}: ActivitySummaryProps) {
  return (
    <Card className={`${bgColor} ${borderColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change ? (
          <div className="mt-1 flex items-center text-xs">
            <span className={changeType === "increase" ? "text-emerald-600" : "text-red-600"}>
              <span className={iconColor}>{icon}</span>
              {change}
            </span>
            <span className="text-muted-foreground ml-1">from last period</span>
          </div>
        ) : (
          <div className="mt-1 flex items-center text-xs">
            <span className={iconColor}>{icon}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
