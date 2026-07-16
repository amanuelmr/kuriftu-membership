import Image from "next/image"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ProductCardProps {
  image: string
  title: string
  description: string
  pointsRequired: string
  currentPoints: string
  canAfford: boolean
  isRedeeming?: boolean
  onRedeem?: () => void
}

export function ProductCard({ image, title, description, pointsRequired, currentPoints, canAfford, isRedeeming, onRedeem }: ProductCardProps) {
  const currentPointsNum = Number.parseInt(currentPoints.replace(/,/g, ""))
  const pointsRequiredNum = Number.parseInt(pointsRequired.replace(/,/g, ""))
  const progressPercentage = Math.min(Math.round((currentPointsNum / pointsRequiredNum) * 100), 100)

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
        <div className="absolute top-4 right-4">
          <div className="bg-primary text-primary-foreground font-bold px-3 py-1 rounded-md">
            {pointsRequired} Points
          </div>
        </div>
      </div>
      <CardHeader>
        <h3 className="text-xl font-bold">{title}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{description}</p>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>
              {currentPoints} / {pointsRequired} points
            </span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className={canAfford ? "h-2 bg-emerald-100" : "h-2 bg-amber-100"}>
            <div
              className={
                canAfford
                  ? "h-full bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full"
                  : "h-full bg-gradient-to-r from-amber-500 to-amber-700 rounded-full"
              }
            />
          </Progress>
        </div>
      </CardContent>
      <CardFooter>
        {canAfford ? (
          <Button className="w-full group" onClick={onRedeem} disabled={isRedeeming || !onRedeem}>
            {isRedeeming ? "Redeeming…" : "Redeem Now"}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button className="w-full" variant="outline" disabled>
            Not Enough Points
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
