import { NextResponse } from "next/server"
import { SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env.API_SECRET_KEY)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Create form data
    const formData = new URLSearchParams()
    formData.append("username", email) // FastAPI OAuth2 expects "username" field
    formData.append("password", password)

    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Backend authentication error:", errorData)
      
      // Handle validation errors (422)
      if (response.status === 422) {
        return NextResponse.json(
          { error: "Invalid email or password format" },
          { status: 422 }
        )
      }
      
      // Handle authentication errors (401)
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        )
      }

      // Handle other errors
      return NextResponse.json(
        { error: errorData.detail || "Authentication failed" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Generate a JWT token
    const token = await new SignJWT({ email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret)

    // Return both the backend token and our JWT
    return NextResponse.json({
      access_token: data.access_token,
      token_type: "bearer",
    })
  } catch (error) {
    console.error("Error during authentication:", error)
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    )
  }
} 