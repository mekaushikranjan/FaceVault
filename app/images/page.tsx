"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import ImageGrid from "@/components/image-grid"
import { Loader2 } from "lucide-react"
import { AuthModal } from "@/components/auth-modal"
import { getAllImages } from "@/lib/data"
import { ImageType } from "@/lib/types"

export default function ImagesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [images, setImages] = useState<ImageType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getAllImages()
        setImages(data)
      } catch (error) {
        console.error("Error fetching images:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      if (isAuthenticated) {
        fetchImages()
      } else {
        setShowAuthModal(true)
      }
    }
  }, [isAuthenticated, authLoading])

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">All Photos</h1>
          <p className="text-muted-foreground mt-2">View and manage all your photos</p>
        </div>
      </section>

      <section className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <ImageGrid images={images} />
        )}
      </section>

      {/* Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultTab="login" />
    </div>
  )
} 