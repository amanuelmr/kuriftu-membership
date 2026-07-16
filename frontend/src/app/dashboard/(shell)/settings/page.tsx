"use client"

import { useState } from "react"
import { User, Bell, Shield, CreditCard } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateUserProfile } from "@/lib/api"
import { useUser } from "@/lib/hooks"

// Only the fields the backend's PUT /users/me actually persists.
const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

type NotificationChannel = "email" | "push" | "sms"
type NotificationType = "marketing" | "social" | "security" | "promotions" | "updates" | "newsletter"

type NotificationSettings = {
  [key in NotificationChannel]: {
    [key in NotificationType]: boolean
  }
}

const notificationSettings: NotificationSettings = {
  email: {
    marketing: true,
    social: true,
    security: true,
    promotions: true,
    updates: true,
    newsletter: true,
  },
  push: {
    marketing: false,
    social: true,
    security: true,
    promotions: false,
    updates: true,
    newsletter: false,
  },
  sms: {
    marketing: false,
    social: false,
    security: true,
    promotions: false,
    updates: false,
    newsletter: false,
  },
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [notifications, setNotifications] = useState<NotificationSettings>(notificationSettings)
  const [isLoading, setIsLoading] = useState(false)
  const { user, mutate } = useUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    // `values` keeps the form in sync once the user loads.
    values: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
    },
  })

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true)
      await updateUserProfile(data)
      await mutate()
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?"
    : "?"

  const handleNotificationToggle = (channel: NotificationChannel, type: NotificationType) => {
    setNotifications((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel][type],
      },
    }))
  }

  return (
    <>
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Settings</h1>
      <p className="text-muted-foreground">Manage your account settings and preferences.</p>
    </div>

    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">
          <User className="mr-2 h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="security">
          <Shield className="mr-2 h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="billing">
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <form onSubmit={handleSubmit(handleProfileSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar} alt={user ? `${user.firstName} ${user.lastName}` : "Member"} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email ?? ""} disabled readOnly />
                <p className="text-sm text-muted-foreground">Email can&apos;t be changed here. Contact support if you need to update it.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Manage how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-marketing">Marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new products, features, and more.
                    </p>
                  </div>
                  <Switch
                    id="email-marketing"
                    checked={notifications.email.marketing}
                    onCheckedChange={() => handleNotificationToggle("email", "marketing")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-security">Security</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about your account activity and security.
                    </p>
                  </div>
                  <Switch
                    id="email-security"
                    checked={notifications.email.security}
                    onCheckedChange={() => handleNotificationToggle("email", "security")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Push Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-updates">Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications about important updates.
                    </p>
                  </div>
                  <Switch
                    id="push-updates"
                    checked={notifications.push.updates}
                    onCheckedChange={() => handleNotificationToggle("push", "updates")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-promotions">Promotions</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications about promotions and special offers.
                    </p>
                  </div>
                  <Switch
                    id="push-promotions"
                    checked={notifications.push.promotions}
                    onCheckedChange={() => handleNotificationToggle("push", "promotions")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security and privacy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Password</h3>
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="2fa">Enable 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <Switch id="2fa" />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="billing" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>Manage your payment methods and billing details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Payment Methods</h3>
              <Button variant="outline" className="w-full">
                Add Payment Method
              </Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Billing History</h3>
              <p className="text-sm text-muted-foreground">
                View your past invoices and payment history.
              </p>
              <Button variant="outline" className="w-full">
                View Billing History
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </>
  )
}
