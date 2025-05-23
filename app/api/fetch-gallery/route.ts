import { NextResponse } from "next/server"
import { fetchStatus } from "./shared-state"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { action } = await request.json()

    if (action !== "start") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Start the Python Selenium process
    // This would typically be done by spawning a child process or using a queue
    // For now, we'll just simulate it

    // Update the shared state
    fetchStatus.status = "running"
    fetchStatus.progress = 0
    fetchStatus.imageCount = 0
    fetchStatus.startTime = Date.now()
    fetchStatus.error = undefined
    fetchStatus.endTime = undefined

    // Simulate the process running in the background
    setTimeout(() => {
      fetchStatus.status = "completed"
      fetchStatus.progress = 100
      fetchStatus.imageCount = Math.floor(Math.random() * 50) + 10
      fetchStatus.endTime = Date.now()
    }, 10000) // Simulate 10 seconds of processing

    return NextResponse.json({
      success: true,
      message: "Gallery fetch started",
    })
  } catch (error) {
    console.error("Error starting gallery fetch:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  // Return the current status from the shared state
  return NextResponse.json(fetchStatus)
}
