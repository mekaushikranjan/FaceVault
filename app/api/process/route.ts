import { NextResponse } from "next/server"
import { processImage } from "@/lib/image-processor"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { imageUrl, pathname } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    await processImage(imageUrl, pathname)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
