import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.API_SECRET_KEY)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid token" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    await jwtVerify(token, secret)

    const response = await fetch(`${API_BASE_URL}/users/storage`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching storage info:", error)
    return NextResponse.json(
      { error: "Failed to fetch storage info" },
      { status: 401 }
    )
  }
} 