"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, ArrowRight, Calendar, Database, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface SubscriptionSuccessProps {
  plan: string
  storage: string
  duration: "6months" | "12months"
  startDate: Date
  endDate: Date
  onClose: () => void
}

export function SubscriptionSuccess({ 
  plan, 
  storage, 
  duration,
  startDate,
  endDate,
  onClose 
}: SubscriptionSuccessProps) {
  const router = useRouter()

  useEffect(() => {
    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      onClose()
    }, 10000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">
          Welcome to {plan} Plan!
        </h2>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              <span className="text-blue-400 font-medium">
                {duration === "6months" ? "6 Months" : "12 Months"} Subscription
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              Valid from {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Database className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-medium">Storage Upgrade</span>
            </div>
            <p className="text-gray-300 text-sm">
              You now have access to {storage} of storage space
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push("/upload")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Uploading
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-400 hover:text-white"
          >
            Continue to Settings
          </Button>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          This window will automatically close in 10 seconds
        </p>
      </div>
    </div>
  )
} 