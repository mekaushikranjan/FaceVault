import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      )
    }

    // Here you would typically create the user in your database
    // For now, we'll just return a success response
    const user = {
      id: "1",
      username,
      email,
      full_name: null,
      bio: null,
      profile_image: null,
      is_verified: false
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
} 