import { NextResponse } from "next/server"

// Access the same module-level variable from the parent route
// This is a simplified approach - in a production app, you'd use a proper database or state management
import { fetchStatus } from "../shared-state"

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(fetchStatus)
}
