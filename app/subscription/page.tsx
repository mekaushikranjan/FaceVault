"use client"

import { SubscriptionPlans } from "@/components/subscription-plans"

export default function SubscriptionPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Subscription Plans</h1>
        <p className="text-xl text-muted-foreground">
          Choose the perfect plan for your needs
        </p>
      </div>
      <SubscriptionPlans />
    </div>
  )
} 