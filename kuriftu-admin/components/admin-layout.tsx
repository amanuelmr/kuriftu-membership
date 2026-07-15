import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"
import { Home, Users, Gift } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-kuriftu-dark text-white p-4 md:flex">
        <div className="flex h-20 items-center px-4 mb-6">
          <div className="w-full flex justify-center">
            <Image src="https://www.kurifturesorts.com/_nuxt/img/logo.e2cce34.svg" alt="Kuriftu Resort Logo" width={150} height={60} className="h-auto" />
          </div>
        </div>
        <nav className="flex-1 space-y-2 py-4">
          <NavItem href="/" icon={<Home className="mr-2 h-4 w-4" />}>
            Dashboard
          </NavItem>
          <NavItem href="/customers" icon={<Users className="mr-2 h-4 w-4" />}>
            Customers
          </NavItem>
          <NavItem href="/services" icon={<Gift className="mr-2 h-4 w-4" />}>
            Services
          </NavItem>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-4 shadow-sm">
          <div className="md:hidden">
            <MobileNav />
          </div>
          <div className="md:hidden ml-2">
            <Image src="/images/logo.png" alt="Kuriftu Resort Logo" width={100} height={40} className="h-auto" />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="font-medium">Admin User</div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}

interface NavItemProps {
  href: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

function NavItem({ href, icon, children, className }: NavItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn("w-full justify-start text-white hover:bg-white/10 hover:text-white", className)}
      asChild
    >
      <Link href={href}>
        {icon}
        {children}
      </Link>
    </Button>
  )
}

function MobileNav() {
  return (
    <div className="flex md:hidden">
      <Button variant="ghost" size="icon" className="mr-2 text-kuriftu-primary" asChild>
        <Link href="/">
          <Home className="h-5 w-5" />
          <span className="sr-only">Dashboard</span>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="mr-2 text-kuriftu-primary" asChild>
        <Link href="/customers">
          <Users className="h-5 w-5" />
          <span className="sr-only">Customers</span>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="text-kuriftu-primary" asChild>
        <Link href="/services">
          <Gift className="h-5 w-5" />
          <span className="sr-only">Services</span>
        </Link>
      </Button>
    </div>
  )
}
