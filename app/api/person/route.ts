import { NextResponse } from "next/server"

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const person = await request.json()

    if (!person.id || !person.name) {
      return NextResponse.json({ error: "Invalid person data" }, { status: 400 })
    }

    // In a real app, update the person in the database
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      person,
    })
  } catch (error) {
    console.error("Error updating person:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
