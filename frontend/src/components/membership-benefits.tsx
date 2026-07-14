'use client'

import { Check } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/lib/hooks"

export function MembershipBenefits() {
  const { user } = useUser()
  const currentTier = user?.membershipTier ?? "Basic"

  const tiers = [
    {
      name: "Basic",
      benefits: [
        "Earn 10 points per $1 on stays",
        "Earn 5 points per $1 on dining",
        "Earn 8 points per $1 on spa treatments",
        "Member-only rates",
        "Digital membership card",
        "Access to member portal",
      ],
    },
    {
      name: "Golden",
      benefits: [
        "All Basic benefits",
        "10% discount on accommodations",
        "Early check-in when available",
        "Welcome amenity upon arrival",
        "5% discount at resort restaurants",
        "1,000 bonus points on your birthday",
        "Earn 1.5x points on all spending",
      ],
    },
    {
      name: "Platinum",
      benefits: [
        "All Golden benefits",
        "15% discount on accommodations",
        "Guaranteed late checkout (2 PM)",
        "Complimentary 30-min spa treatment per stay",
        "Room upgrade when available",
        "Priority restaurant reservations",
        "10% discount at resort restaurants",
        "Exclusive access to member events",
        "Dedicated concierge service",
        "Earn 2x points on all spending",
      ],
    },
    {
      name: "Diamond",
      benefits: [
        "All Platinum benefits",
        "25% discount on accommodations",
        "Guaranteed room upgrade",
        "Complimentary airport transfers",
        "Personalized in-room amenities",
        "Dedicated personal assistant",
        "Exclusive access to private events",
        "Complimentary 60-min spa treatment per stay",
        "20% discount at resort restaurants",
        "Complimentary minibar",
        "Earn 2.5x points on all spending",
        "Annual 5,000 bonus points",
        "Ability to gift Gold status to a friend",
      ],
    },
  ]

  return (
    <Tabs defaultValue={currentTier}>
      <TabsList className="grid w-full grid-cols-4">
        {tiers.map((tier) => {
          const isCurrent = tier.name === currentTier
          return (
            <TabsTrigger key={tier.name} value={tier.name} className={isCurrent ? "bg-primary/10" : ""}>
              {tier.name}
              {isCurrent && <span className="ml-2 text-xs">(Current)</span>}
            </TabsTrigger>
          )
        })}
      </TabsList>
      {tiers.map((tier) => (
        <TabsContent key={tier.name} value={tier.name} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{tier.name} Membership Benefits</CardTitle>
              <CardDescription>
                {tier.name === currentTier
                  ? "Your current membership benefits"
                  : `Benefits you ${tier.name === "Basic" ? "currently have" : "would receive"} with ${tier.name} membership`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 md:grid-cols-2">
                {tier.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  )
}
