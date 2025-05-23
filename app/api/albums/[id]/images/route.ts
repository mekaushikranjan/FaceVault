import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid token" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    const { id } = await params

    // Forward the request to the backend with the same token
    const response = await fetch(`${API_BASE_URL}/albums/${id}/images`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Backend API error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching album images:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch album images" },
      { status: 401 }
    )
  }
} 