"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

interface StorageInfo {
  used: number
  limit: number
  used_percentage: number
}

export function StorageIndicator() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchStorageInfo = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await fetch("/api/users/storage", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch storage info")
        }

        const data = await response.json()
        setStorageInfo(data)
      } catch (error) {
        console.error("Error fetching storage info:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStorageInfo()
  }, [toast])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={0} />
          <p className="text-sm text-muted-foreground mt-2">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!storageInfo) {
    return null
  }

  const formatBytes = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB", "TB"]
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={storageInfo.used_percentage} />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{formatBytes(storageInfo.used)} used</span>
          <span>{formatBytes(storageInfo.limit)} total</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {storageInfo.used_percentage.toFixed(1)}% of storage used
        </p>
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => router.push("/subscription")}
        >
          Upgrade Storage <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
} 