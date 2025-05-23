import { NextResponse } from "next/server"
import Stripe from "stripe"
import { headers } from "next/headers"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = (await headers()).get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, plan } = session.metadata!

        // Update user's subscription in your database
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/subscription`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.API_SECRET_KEY}`,
            },
            body: JSON.stringify({
              userId,
              plan,
              subscriptionId: session.subscription,
              customerId: session.customer,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to update user subscription")
          }
        } catch (error) {
          console.error("Error updating user subscription:", error)
          return NextResponse.json(
            { error: "Failed to update user subscription" },
            { status: 500 }
          )
        }
        break
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.userId

        // Update user's subscription status in your database
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/subscription/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.API_SECRET_KEY}`,
            },
            body: JSON.stringify({
              userId,
              status: subscription.status,
              subscriptionId: subscription.id,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to update subscription status")
          }
        } catch (error) {
          console.error("Error updating subscription status:", error)
          return NextResponse.json(
            { error: "Failed to update subscription status" },
            { status: 500 }
          )
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
} 