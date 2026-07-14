import { Award, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MembershipUpgradeCardProps {
  tier: string
  pointsRequired: string
  currentPoints: string
  benefits: string[]
  color: "amber" | "slate" | "purple"
  canAfford: boolean
  current?: boolean
  onUpgrade?: () => void
  onPurchase?: () => void
  isProcessing?: boolean
}

export function MembershipUpgradeCard({
  tier,
  pointsRequired,
  currentPoints,
  benefits,
  color,
  canAfford,
  current = false,
  onUpgrade,
  onPurchase,
  isProcessing = false,
}: MembershipUpgradeCardProps) {
  const colorClasses = {
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      heading: "text-amber-800",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
      icon: "text-amber-600",
      progress: "bg-amber-200",
      progressFill: "bg-amber-600",
    },
    slate: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      heading: "text-slate-800",
      button: "bg-slate-700 hover:bg-slate-800 text-white",
      icon: "text-slate-600",
      progress: "bg-slate-200",
      progressFill: "bg-slate-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      heading: "text-purple-800",
      button: "bg-purple-700 hover:bg-purple-800 text-white",
      icon: "text-purple-600",
      progress: "bg-purple-200",
      progressFill: "bg-purple-600",
    },
  }

  const currentPointsNum = Number.parseInt(currentPoints.replace(/,/g, ""))
  const pointsRequiredNum = Number.parseInt(pointsRequired.replace(/,/g, ""))
  const progressPercentage = Math.min(Math.round((currentPointsNum / pointsRequiredNum) * 100), 100)

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        colorClasses[color].bg,
        colorClasses[color].border,
        current && "ring-2 ring-primary",
      )}
    >
      {current && (
        <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
          Current Tier
        </div>
      )}
      <CardHeader className={cn("pb-2", colorClasses[color].heading)}>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          <h3 className="font-serif text-xl font-bold">{tier}</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>
              {currentPoints} / {pointsRequired} points
            </span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className={cn("h-2", colorClasses[color].progress)}>
            <div className={cn("h-full rounded-full", colorClasses[color].progressFill)} />
          </Progress>
        </div>

        <ul className="space-y-2">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className={cn("h-4 w-4 mt-0.5", colorClasses[color].icon)} />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {current ? (
          <Button className="w-full" variant="outline" disabled>
            Current Tier
          </Button>
        ) : canAfford ? (
          <Button
            className={cn("w-full", colorClasses[color].button)}
            disabled={isProcessing}
            onClick={onUpgrade}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upgrade Now
          </Button>
        ) : (
          <Button className="w-full" variant="outline" disabled={isProcessing} onClick={onPurchase}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Purchase Upgrade
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
