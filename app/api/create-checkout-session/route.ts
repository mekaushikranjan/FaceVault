import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
})

const plans = {
  pro: {
    price: 999, // $9.99
    storage: "100GB",
    features: [
      "Advanced Face Detection",
      "Unlimited Photos",
      "Priority Support",
      "Custom Albums",
      "Advanced Search",
    ],
  },
  enterprise: {
    price: 2999, // $29.99
    storage: "1TB",
    features: [
      "AI-Powered Face Detection",
      "Unlimited Photos",
      "24/7 Support",
      "Custom Albums",
      "Advanced Search",
      "API Access",
      "Team Collaboration",
    ],
  },
}

export async function POST(request: NextRequest) {
  try {
    const { plan, userId } = await request.json()

    if (!plan || !plans[plan as keyof typeof plans]) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      )
    }

    const selectedPlan = plans[plan as keyof typeof plans]

    // Get the origin from the request headers
    const origin = request.headers.get("origin") || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `${selectedPlan.storage} Storage`,
              metadata: {
                features: JSON.stringify(selectedPlan.features)
              }
            },
            unit_amount: selectedPlan.price,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/settings?success=true`,
      cancel_url: `${origin}/settings?canceled=true`,
      metadata: {
        userId,
        plan,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 }
    )
  }
} 