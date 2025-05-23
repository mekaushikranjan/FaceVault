"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getAllImages, addImagesToAlbum } from "@/lib/data"
import { ImageType } from "@/lib/types"
import { toast } from "sonner"

export function AddImagesDialog({ albumId }: { albumId: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [images, setImages] = useState<ImageType[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleOpen = async () => {
    setIsOpen(true)
    try {
      const allImages = await getAllImages()
      setImages(allImages)
    } catch (error) {
      toast.error("Failed to load images")
    }
  }

  const handleImageSelect = (imageId: string) => {
    setSelectedImages((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    )
  }

  const handleAddImages = async () => {
    if (selectedImages.length === 0) return

    setIsLoading(true)
    try {
      await addImagesToAlbum(selectedImages, albumId)
      toast.success("Images added to album")
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to add images to album")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleOpen}>
          <ImagePlus className="mr-2 h-4 w-4" />
          Add Photos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Photos to Album</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 ${
                  selectedImages.includes(image.id)
                    ? "border-blue-500"
                    : "border-transparent"
                }`}
                onClick={() => handleImageSelect(image.id)}
              >
                <img
                  src={image.url}
                  alt={image.caption || "Image"}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddImages}
              disabled={selectedImages.length === 0 || isLoading}
            >
              Add {selectedImages.length} Photos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 