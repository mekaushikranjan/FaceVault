import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface StatsCardProps {
  title: string
  value: string
  icon: React.ReactNode
  description: string
  trend?: "up" | "down"
  trendValue?: string
  progress?: number
  showUpgradeButton?: boolean
}

export function StatsCard({ title, value, icon, description, trend, trendValue, progress, showUpgradeButton }: StatsCardProps) {
  const router = useRouter()

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h4 className="text-2xl font-bold text-foreground mt-1">{value}</h4>
          </div>
          <div className="p-2 bg-muted rounded-md">{icon}</div>
        </div>

        <div className="mt-4">
          {progress !== undefined ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ) : (
            <div className="flex items-center">
              <p className="text-sm text-muted-foreground">{description}</p>
              {trend && trendValue && (
                <div className={`ml-auto flex items-center ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  <span className="text-xs font-medium">{trendValue}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {showUpgradeButton && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => router.push("/subscription")}
          >
            Upgrade Storage <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
