"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Check, AlertCircle, ArrowRight } from "lucide-react"
import { formatBytes } from "@/lib/utils"

interface Plan {
  name: string
  storage: string
  price: {
    monthly: number
    "6months": number
    "12months": number
  }
  features: string[]
}

const plans: Plan[] = [
  {
    name: "Free",
    storage: "10GB",
    price: {
      monthly: 0,
      "6months": 0,
      "12months": 0
    },
    features: [
      "Basic face detection",
      "Up to 10GB storage",
      "Standard support",
      "Basic organization tools"
    ]
  },
  {
    name: "Pro",
    storage: "100GB",
    price: {
      monthly: 9.99,
      "6months": 8.99,
      "12months": 7.99
    },
    features: [
      "Advanced face detection",
      "Up to 100GB storage",
      "Priority support",
      "Advanced organization tools",
      "Custom albums",
      "Bulk operations"
    ]
  },
  {
    name: "Enterprise",
    storage: "1TB",
    price: {
      monthly: 29.99,
      "6months": 24.99,
      "12months": 19.99
    },
    features: [
      "Premium face detection",
      "Up to 1TB storage",
      "24/7 priority support",
      "Advanced organization tools",
      "Custom albums",
      "Bulk operations",
      "API access",
      "Custom integrations"
    ]
  }
]

interface StorageInfo {
  storage_limit: number
  storage_used: number
  storage_remaining: number
  usage_percentage: number
}

export function SubscriptionPlans() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [duration, setDuration] = useState<"monthly" | "6months" | "12months">("monthly")
  const [isLoading, setIsLoading] = useState(false)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)

  useEffect(() => {
    fetchSubscriptionStatus()
    fetchStorageInfo()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/subscriptions/status")
      const data = await response.json()
      setCurrentSubscription(data)
    } catch (error) {
      console.error("Error fetching subscription status:", error)
    }
  }

  const fetchStorageInfo = async () => {
    try {
      const response = await fetch("/api/subscriptions/storage")
      const data = await response.json()
      setStorageInfo(data)
    } catch (error) {
      console.error("Error fetching storage info:", error)
    }
  }

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast({
        title: "Error",
        description: "Please select a plan",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Store plan and duration in localStorage for success page
      localStorage.setItem("userPlan", selectedPlan.toLowerCase())
      localStorage.setItem("subscriptionDuration", duration)

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan: selectedPlan.toLowerCase(),
          duration: duration
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to create checkout session")
      }

      const data = await response.json()
      if (data.url) {
        router.push(data.url)
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error) {
      console.error("Subscription error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create checkout session",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to cancel subscription")
      }

      toast({
        title: "Success",
        description: "Subscription cancelled successfully. Your plan will remain active until the end of the billing period."
      })
      
      // Refresh subscription status
      await fetchSubscriptionStatus()
    } catch (error) {
      console.error("Cancel subscription error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-8">
      {storageInfo && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Storage Usage</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Used: {formatBytes(storageInfo.storage_used)}</span>
              <span>Total: {formatBytes(storageInfo.storage_limit)}</span>
            </div>
            <Progress 
              value={storageInfo.usage_percentage} 
              className={`h-2 ${
                storageInfo.usage_percentage > 90 ? "bg-red-500" :
                storageInfo.usage_percentage > 75 ? "bg-yellow-500" :
                "bg-green-500"
              }`}
            />
            <p className="text-sm text-muted-foreground">
              {formatBytes(storageInfo.storage_remaining)} remaining
            </p>
          </div>
        </Card>
      )}

      {currentSubscription?.is_active && (
        <Card className="p-6 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Current Plan: {currentSubscription.plan}</h3>
              <p className="text-sm text-muted-foreground">
                {currentSubscription.plan === "free" ? (
                  "Unlimited validity"
                ) : (
                  `${currentSubscription.days_remaining} days remaining`
                )}
              </p>
            </div>
            {currentSubscription.plan !== "free" && (
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={isLoading}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`p-6 relative ${
              selectedPlan === plan.name
                ? "border-primary ring-2 ring-primary"
                : ""
            }`}
          >
            {selectedPlan === plan.name && (
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-2xl font-bold mt-2">
                  ${plan.price[duration]}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{duration === "monthly" ? "month" : duration}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">{plan.storage} Storage</p>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 mr-2 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                className="w-full"
                variant={selectedPlan === plan.name ? "default" : "outline"}
                onClick={() => setSelectedPlan(plan.name)}
                disabled={isLoading || (currentSubscription?.plan === plan.name.toLowerCase() && currentSubscription?.is_active)}
              >
                {currentSubscription?.plan === plan.name.toLowerCase() && currentSubscription?.is_active
                  ? "Current Plan"
                  : selectedPlan === plan.name
                  ? "Selected"
                  : "Select Plan"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          variant={duration === "monthly" ? "default" : "outline"}
          onClick={() => setDuration("monthly")}
        >
          Monthly
        </Button>
        <Button
          variant={duration === "6months" ? "default" : "outline"}
          onClick={() => setDuration("6months")}
        >
          6 Months
        </Button>
        <Button
          variant={duration === "12months" ? "default" : "outline"}
          onClick={() => setDuration("12months")}
        >
          12 Months
        </Button>
      </div>

      {selectedPlan && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleSubscribe}
            disabled={isLoading || selectedPlan === currentSubscription?.plan}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Subscribe to {selectedPlan} Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 