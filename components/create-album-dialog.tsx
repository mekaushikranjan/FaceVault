"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createAlbum, getAllImages, addImagesToAlbum } from "@/lib/data"
import { Album, ImageType } from "@/lib/types"
import Image from "next/image"
import { Check } from "lucide-react"

interface CreateAlbumDialogProps {
  isOpen: boolean
  onClose: () => void
  onAlbumCreated: (album: Album) => void
}

export default function CreateAlbumDialog({ isOpen, onClose, onAlbumCreated }: CreateAlbumDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<ImageType[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(true)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const imagesData = await getAllImages()
        setImages(imagesData)
      } catch (error) {
        console.error("Error fetching images:", error)
      } finally {
        setIsLoadingImages(false)
      }
    }

    if (isOpen) {
      fetchImages()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      const album = await createAlbum(name.trim(), description.trim())
      
      // Add selected images to the album
      if (selectedImages.length > 0) {
        await addImagesToAlbum(selectedImages, album.id)
      }
      
      onAlbumCreated(album)
      onClose()
      // Reset form
      setName("")
      setDescription("")
      setSelectedImages([])
    } catch (error) {
      console.error("Error creating album:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Album</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Album Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter album name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter album description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Images (Optional)</Label>
            {isLoadingImages ? (
              <div className="text-center py-4">Loading images...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto p-2">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 ${
                      selectedImages.includes(image.id) ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => toggleImageSelection(image.id)}
                  >
                    <Image
                      src={image.url}
                      alt={image.caption || 'Album image'}
                      fill
                      className="object-cover"
                    />
                    {selectedImages.includes(image.id) && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Check className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Creating..." : "Create Album"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 