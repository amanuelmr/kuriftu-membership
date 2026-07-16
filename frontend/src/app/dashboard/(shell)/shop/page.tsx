"use client"

import { useState } from "react"
import { ShoppingBag, Filter, Search, Tag, Award, ArrowRight, Gift } from "lucide-react"
import { useUser } from "@/lib/hooks"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShopProductCard } from "@/components/shop-product-card"
import { ShopCategoryFilter } from "@/components/shop-category-filter"
import { ShopCheckoutModal } from "@/components/shop-checkout-modal"

// Sample product data - in a real app, this would come from an API
const products = [
  {
    id: "1",
    name: "Luxury Weekend Package",
    description: "2-night stay in a Deluxe Room with breakfast, dinner, and spa treatment.",
    price: 450,
    pointsEarned: 4500,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "packages",
    featured: true,
    inStock: true,
  },
  {
    id: "2",
    name: "Spa Day Pass",
    description: "Full day access to our spa facilities with one 60-minute treatment of your choice.",
    price: 120,
    pointsEarned: 1200,
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "spa",
    featured: false,
    inStock: true,
  },
  {
    id: "3",
    name: "Romantic Dinner for Two",
    description: "5-course gourmet dinner with wine pairing at our lakeside restaurant.",
    price: 180,
    pointsEarned: 1800,
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "dining",
    featured: true,
    inStock: true,
  },
  {
    id: "4",
    name: "Lake Excursion",
    description: "3-hour private boat tour of Lake Bishoftu with refreshments.",
    price: 95,
    pointsEarned: 950,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "activities",
    featured: false,
    inStock: true,
  },
  {
    id: "5",
    name: "Kuriftu Signature Bathrobe",
    description: "Premium cotton bathrobe with Kuriftu Resort logo embroidery.",
    price: 75,
    pointsEarned: 750,
    image:
      "https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "merchandise",
    featured: false,
    inStock: true,
  },
  {
    id: "6",
    name: "Premium Airport Transfer",
    description: "Luxury vehicle airport transfer service with refreshments.",
    price: 60,
    pointsEarned: 600,
    image:
      "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "services",
    featured: false,
    inStock: true,
  },
  {
    id: "7",
    name: "Deluxe Room - 1 Night",
    description: "One night stay in our Deluxe Room with breakfast included.",
    price: 200,
    pointsEarned: 2000,
    image:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "accommodations",
    featured: true,
    inStock: true,
  },
  {
    id: "8",
    name: "Kuriftu Gift Card",
    description: "Gift card for use at any Kuriftu Resort location. Perfect for any occasion.",
    price: 100,
    pointsEarned: 1000,
    image:
      "https://images.unsplash.com/photo-1556742031-c6961e8560b0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "gift-cards",
    featured: false,
    inStock: true,
  },
]

export default function ShopPage() {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[0] | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  // Filter products based on search query and category
  const filteredProducts = products.filter(
    (product) =>
      (activeCategory === "all" || product.category === activeCategory) &&
      product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const featuredProducts = products.filter((product) => product.featured)

  const handlePurchase = (product: (typeof products)[0]) => {
    setSelectedProduct(product)
    setCheckoutOpen(true)
  }

  return (
    <>
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Shop & Earn</h1>
      <p className="text-muted-foreground">
        Purchase experiences, services, and merchandise while earning valuable membership points.
      </p>
    </div>

    <Card className="bg-gradient-to-r from-primary/20 to-primary/5 border-primary/20">
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/20 p-3">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Earn 10 Points Per $1 Spent</h2>
            <p className="text-muted-foreground">
              {user?.membershipTier === "Diamond"
                ? "Diamond members earn 2.5x points (25 points per $1)"
                : user?.membershipTier === "Platinum"
                  ? "Platinum members earn 2x points (20 points per $1)"
                  : user?.membershipTier === "Golden"
                    ? "Golden members earn 1.5x points (15 points per $1)"
                    : "Basic members earn 10 points per $1"}
            </p>
          </div>
        </div>
        <Button className="w-full md:w-auto gap-2 group">
          View Your Points
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>

    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ShopCategoryFilter activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
        <Button>
          <Tag className="mr-2 h-4 w-4" />
          Sort by: Featured
        </Button>
      </div>
    </div>

    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">All Products</TabsTrigger>
        <TabsTrigger value="featured">Featured</TabsTrigger>
        <TabsTrigger value="orders">My Orders</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ShopProductCard
                key={product.id}
                product={product}
                membershipTier={user?.membershipTier || "Basic"}
                onPurchase={() => handlePurchase(product)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setActiveCategory("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
      <TabsContent value="featured" className="mt-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ShopProductCard
              key={product.id}
              product={product}
              membershipTier={user?.membershipTier || "Basic"}
              onPurchase={() => handlePurchase(product)}
            />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="orders" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Orders</CardTitle>
            <CardDescription>Track your purchases and order history</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-10">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You have not made any purchases yet.</p>
            <Button onClick={() => document.getElementById("all-tab")?.click()}>Browse Products</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <Card>
      <CardHeader>
        <CardTitle>Membership Point Multipliers</CardTitle>
        <CardDescription>Earn more points based on your membership tier</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border p-4 bg-background">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-background text-foreground">
                Basic
              </Badge>
            </div>
            <p className="text-2xl font-bold">1x</p>
            <p className="text-sm text-muted-foreground">10 points per $1</p>
          </div>
          <div className="rounded-lg border p-4 bg-gold-50 border-gold-200">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-gold-100 text-gold-800 border-gold-200">
                Golden
              </Badge>
            </div>
            <p className="text-2xl font-bold text-gold-800">1.5x</p>
            <p className="text-sm text-muted-foreground">15 points per $1</p>
          </div>
          <div className="rounded-lg border p-4 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">
                Platinum
              </Badge>
            </div>
            <p className="text-2xl font-bold text-slate-800">2x</p>
            <p className="text-sm text-muted-foreground">20 points per $1</p>
          </div>
          <div className="rounded-lg border p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                Diamond
              </Badge>
            </div>
            <p className="text-2xl font-bold text-purple-800">2.5x</p>
            <p className="text-sm text-muted-foreground">25 points per $1</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <a className="w-full inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" href="/dashboard/membership">
          <Gift className="mr-2 h-4 w-4" />
          Upgrade Your Membership
        </a>
      </CardFooter>
    </Card>

      {selectedProduct && (
        <ShopCheckoutModal
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          product={selectedProduct}
          membershipTier={user?.membershipTier || "Basic"}
        />
      )}
    </>
  )
}
