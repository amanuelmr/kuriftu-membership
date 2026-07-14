'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { submitSurvey } from "@/lib/api"

const surveyFormSchema = z.object({
  visitPurpose: z.enum(["leisure", "business", "both"], {
    required_error: "Please select your primary purpose",
  }),
  preferredAccommodation: z.array(z.string()).min(1, "Please select at least one option"),
  interests: z.array(z.string()).min(1, "Please select at least one interest"),
  travelFrequency: z.enum(["first-time", "occasional", "frequent"], {
    required_error: "Please select your travel frequency",
  }),
  specialOccasions: z.string().optional(),
  additionalNotes: z.string().optional(),
})

type SurveyFormData = z.infer<typeof surveyFormSchema>

export default function SurveyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SurveyFormData>({
    resolver: zodResolver(surveyFormSchema),
  })

  const onSubmit = async (data: SurveyFormData) => {
    try {
      setIsLoading(true)
      await submitSurvey(data)
      toast.success("Thank you for completing the survey!")
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast.error("Failed to submit survey. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    toast.info("You can complete the survey later from your profile settings.")
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container max-w-2xl py-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-serif">Welcome to Kuriftu!</CardTitle>
              <CardDescription>
                Help us personalize your experience by answering a few questions.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
            >
              Skip Survey
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <Label>What is your primary purpose for visiting Kuriftu?</Label>
                <RadioGroup
                  onValueChange={(value: "leisure" | "business" | "both") => setValue("visitPurpose", value)}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="leisure" id="leisure" />
                    <Label htmlFor="leisure">Leisure</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="business" id="business" />
                    <Label htmlFor="business">Business</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both">Both</Label>
                  </div>
                </RadioGroup>
                {errors.visitPurpose && (
                  <p className="text-sm text-destructive">{errors.visitPurpose.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label>What type of accommodation do you prefer?</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="villa"
                      onCheckedChange={(checked: boolean) => {
                        const current = watch("preferredAccommodation") || []
                        setValue(
                          "preferredAccommodation",
                          checked ? [...current, "villa"] : current.filter((item) => item !== "villa")
                        )
                      }}
                    />
                    <Label htmlFor="villa">Villa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="suite"
                      onCheckedChange={(checked: boolean) => {
                        const current = watch("preferredAccommodation") || []
                        setValue(
                          "preferredAccommodation",
                          checked ? [...current, "suite"] : current.filter((item) => item !== "suite")
                        )
                      }}
                    />
                    <Label htmlFor="suite">Suite</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="room"
                      onCheckedChange={(checked: boolean) => {
                        const current = watch("preferredAccommodation") || []
                        setValue(
                          "preferredAccommodation",
                          checked ? [...current, "room"] : current.filter((item) => item !== "room")
                        )
                      }}
                    />
                    <Label htmlFor="room">Standard Room</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tent"
                      onCheckedChange={(checked: boolean) => {
                        const current = watch("preferredAccommodation") || []
                        setValue(
                          "preferredAccommodation",
                          checked ? [...current, "tent"] : current.filter((item) => item !== "tent")
                        )
                      }}
                    />
                    <Label htmlFor="tent">Luxury Tent</Label>
                  </div>
                </div>
                {errors.preferredAccommodation && (
                  <p className="text-sm text-destructive">{errors.preferredAccommodation.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label>What are your main interests? (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="spa"
                      onCheckedChange={(checked: boolean) => {
                        const current = watch("interests") || []
                        setValue(
                          "interests",
                          checked ? [...current, "spa"] : current.filter((item) => item !== "spa")
                        )
                      }}
                    />
                    <Label htmlFor="spa">Spa & Wellness</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dining"
                      onCheckedChange={(checked: boolean) => {
                        const current = watch("interests") || []
                        setValue(
                          "interests",
                          checked ? [...current, "dining"] : current.filter((item) => item !== "dining")
                        )
                      }}
                    />
                    <Label htmlFor="dining">Fine Dining</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="adventure"
                      onCheckedChange={(checked: boolean) => {
                        const current = watch("interests") || []
                        setValue(
                          "interests",
                          checked
                            ? [...current, "adventure"]
                            : current.filter((item) => item !== "adventure")
                        )
                      }}
                    />
                    <Label htmlFor="adventure">Adventure Activities</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="culture"
                      onCheckedChange={(checked: boolean) => {
                        const current = watch("interests") || []
                        setValue(
                          "interests",
                          checked
                            ? [...current, "culture"]
                            : current.filter((item) => item !== "culture")
                        )
                      }}
                    />
                    <Label htmlFor="culture">Cultural Experiences</Label>
                  </div>
                </div>
                {errors.interests && (
                  <p className="text-sm text-destructive">{errors.interests.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label>How often do you plan to visit Kuriftu?</Label>
                <RadioGroup
                  onValueChange={(value: "first-time" | "occasional" | "frequent") => setValue("travelFrequency", value)}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first-time" id="first-time" />
                    <Label htmlFor="first-time">First Time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="occasional" id="occasional" />
                    <Label htmlFor="occasional">Occasionally</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="frequent" id="frequent" />
                    <Label htmlFor="frequent">Frequently</Label>
                  </div>
                </RadioGroup>
                {errors.travelFrequency && (
                  <p className="text-sm text-destructive">{errors.travelFrequency.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label htmlFor="specialOccasions">Are you planning any special occasions? (Optional)</Label>
                <Input
                  id="specialOccasions"
                  placeholder="e.g., Anniversary, Birthday, Honeymoon"
                  {...register("specialOccasions")}
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any specific preferences or requirements?"
                  {...register("additionalNotes")}
                />
              </div>

              <div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Complete Survey"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 