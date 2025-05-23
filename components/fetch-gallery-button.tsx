"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function FetchGalleryButton() {
  const [isFetching, setIsFetching] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleFetch = async () => {
    setIsFetching(true)

    try {
      const response = await fetch("/api/fetch-gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "start" }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Gallery fetch started",
          description: "Your images are being fetched in the background",
        })

        // Poll for status
        const statusInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch("/api/fetch-gallery/status")

            if (!statusResponse.ok) {
              throw new Error(`Status check failed: ${statusResponse.status}`)
            }

            const statusData = await statusResponse.json()

            if (statusData.status === "completed") {
              clearInterval(statusInterval)
              toast({
                title: "Gallery fetch completed",
                description: `Successfully fetched ${statusData.imageCount} images`,
              })
              router.refresh()
            } else if (statusData.status === "failed") {
              clearInterval(statusInterval)
              toast({
                title: "Gallery fetch failed",
                description: statusData.error || "An unknown error occurred",
                variant: "destructive",
              })
            }
          } catch (statusError) {
            console.error("Error checking status:", statusError)
            clearInterval(statusInterval)
            toast({
              title: "Status check failed",
              description: "Could not check the status of your gallery fetch",
              variant: "destructive",
            })
          }
        }, 3000)
      } else {
        throw new Error(data.error || "Failed to start gallery fetch")
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Fetch failed",
        description: error instanceof Error ? error.message : "There was an error fetching your gallery",
        variant: "destructive",
      })
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <Button onClick={handleFetch} disabled={isFetching} className="bg-blue-600 hover:bg-blue-700 text-white">
      <Download className="h-5 w-5 mr-2" />
      {isFetching ? "Fetching..." : "Fetch Gallery"}
    </Button>
  )
}
