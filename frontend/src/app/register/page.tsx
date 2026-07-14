"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Head from "next/head"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { register as apiRegister } from "@/lib/api"
import { setAuth } from "@/lib/auth"

const formSchema = z.object({
  fname: z.string().min(2, "First name must be at least 2 characters"),
  lname: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof formSchema>

// export const metadata: Metadata = {
//   title: "Register | Kuriftu Resort",
//   description: "Create your Kuriftu Resort membership account",
// }

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      terms: false,
    },
  })
//https://kuriftu-membership-backend-3.onrender.com/api/auth//login
  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      const result = await apiRegister(data);

      // Signup returns { token, user }; log the user in immediately so the
      // survey step (and dashboard) are authenticated.
      if (result?.token) {
        setAuth(result.token, result.user?.id ?? "", true)
      }

      toast.success("Registration successful! Please complete our quick survey.")
      router.push("/survey")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
    <Head>
        <title>Register | Kuriftu Resort</title>
    </Head>
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <Image src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80" alt="Kuriftu Resort" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h1 className="font-serif text-4xl font-bold mb-4">Join Our Membership Program</h1>
            <p className="text-lg max-w-md mx-auto">
              Register today to start earning points and enjoying exclusive benefits at Kuriftu Resort.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center p-8 md:p-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <Image src="https://www.kurifturesorts.com/_nuxt/img/logo.e2cce34.svg" alt="Kuriftu Resort Logo" width={40} height={40} className="h-10 w-auto" />
          </div>
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold">Create an Account</h1>
            <p className="text-muted-foreground">Enter your information to register</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fname">First Name</Label>
                <Input
                  id="fname"
                  placeholder="John"
                  {...register("fname")}
                  className={errors.fname ? "border-destructive" : ""}
                />
                {errors.fname && (
                  <p className="text-sm text-destructive">{errors.fname.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lname">Last Name</Label>
                <Input
                  id="lname"
                  placeholder="Doe"
                  {...register("lname")}
                  className={errors.lname ? "border-destructive" : ""}
                />
                {errors.lname && (
                  <p className="text-sm text-destructive">{errors.lname.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                {...register("phone")}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={watch("terms")}
                onCheckedChange={(checked) => setValue("terms", checked as boolean)}
                className={errors.terms ? "border-destructive" : ""}
              />
              <Label htmlFor="terms" className="text-sm font-normal">
                I agree to the{" "}
                <Link href="#" className="text-primary hover:underline">
                  terms of service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-primary hover:underline">
                  privacy policy
                </Link>
              </Label>
            </div>
            {errors.terms && (
              <p className="text-sm text-destructive">{errors.terms.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}
