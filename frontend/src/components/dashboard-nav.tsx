"use client"

import type React from "react"
import Link from "next/link"
import { Award, CreditCard, History, Home, Hotel, Settings, ShoppingBag, Star} from "lucide-react"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  title: string
  isActive?: boolean
}

function NavItem({ href, icon, title, isActive }: NavItemProps) {
  return (
    <Link href={href} className="block">
      <Button
        variant="ghost"
        className={cn("w-full justify-start gap-2", isActive && "bg-primary/10 text-primary hover:bg-primary/20")}
      >
        {icon}
        {title}
      </Button>
    </Link>
  )
}

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:block">
      <div className="space-y-1">
        <NavItem
          href="/dashboard"
          icon={<Home className="h-5 w-5" />}
          title="Dashboard"
          isActive={pathname === "/dashboard"}
        />
        <NavItem
          href="/dashboard/shop"
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Shop & Earn"
          isActive={pathname === "/dashboard/shop"}
        />
        <NavItem
          href="/dashboard/bookings"
          icon={<Hotel className="h-5 w-5" />}
          title="My Bookings"
          isActive={pathname === "/dashboard/bookings"}
        />
        <NavItem
          href="/dashboard/points-rewards"
          icon={<Star className="h-5 w-5" />}
          title="Points & Rewards"
          isActive={pathname === "/dashboard/points-rewards"}
        />
        <NavItem
          href="/dashboard/membership"
          icon={<Award className="h-5 w-5" />}
          title="Membership"
          isActive={pathname === "/dashboard/membership"}
        />
        <NavItem
          href="/dashboard/history"
          icon={<History className="h-5 w-5" />}
          title="Activity History"
          isActive={pathname === "/dashboard/history"}
        />
        <NavItem
          href="/dashboard/payments"
          icon={<CreditCard className="h-5 w-5" />}
          title="Payment Methods"
          isActive={pathname === "/dashboard/payments"}
        />
        <NavItem
          href="/dashboard/settings"
          icon={<Settings className="h-5 w-5" />}
          title="Settings"
          isActive={pathname === "/dashboard/settings"}
        />
      </div>
    </nav>
  )
}
