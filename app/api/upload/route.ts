import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { processImage } from "@/lib/image-processor"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Authenticate and authorize users here if needed
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          tokenPayload: JSON.stringify({
            // optional payload data
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This won't work on localhost, but will work in production
        console.log("Upload completed", blob)

        try {
          // Process the image to detect faces and create albums
          await processImage(blob.url, blob.pathname)
        } catch (error) {
          console.error("Error processing image:", error)
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
