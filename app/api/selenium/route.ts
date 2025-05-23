import { NextResponse } from "next/server"
import { runSeleniumTask } from "@/lib/selenium"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { task, params } = await request.json()

    if (!task) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 })
    }

    const result = await runSeleniumTask(task, params)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error running Selenium task:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
