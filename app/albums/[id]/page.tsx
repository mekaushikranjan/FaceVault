'use client'

import { getAlbumById, getImagesByAlbumId, getAllImages, addImagesToAlbum } from "@/lib/data"
import ImageGrid from "@/components/image-grid"
import { Suspense, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Album as AlbumType, ImageType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Album Actions Component
function AlbumActions({ album, onUpdate }: { album: AlbumType, onUpdate: (updatedAlbum: AlbumType) => void }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(album.name)

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/albums/${album.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to delete album')
      }

      router.push('/albums')
    } catch (error) {
      console.error('Error deleting album:', error)
    }
  }

  const handleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true)
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/albums/${album.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to update album')
      }

      const updatedAlbum = await response.json()
      onUpdate({
        ...album,
        name: updatedAlbum.name,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating album:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Loader2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {isEditing ? (
          <div className="p-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-2 py-1 border rounded"
              placeholder="Album name"
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleEdit}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <DropdownMenuItem onClick={handleEdit}>
              Edit Album
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-500">
              Delete Album
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Add Images Dialog Component
function AddImagesDialog({ albumId, onImagesAdded }: { albumId: string, onImagesAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedImages, setSelectedImages] = useState<ImageType[]>([])
  const [loading, setLoading] = useState(false)
  const [allImages, setAllImages] = useState<ImageType[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const images = await getAllImages()
        setAllImages(images)
      } catch (error) {
        console.error("Error fetching images:", error)
      }
    }
    if (isOpen) {
      fetchImages()
    }
  }, [isOpen])

  const handleAddImages = async () => {
    if (selectedImages.length === 0) return

    try {
      setLoading(true)
      const imageIds = selectedImages.map(img => img.id)
      await addImagesToAlbum(imageIds, albumId)
      setIsOpen(false)
      setSelectedImages([])
      onImagesAdded()
    } catch (error) {
      console.error("Error adding images to album:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Add Photos
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Photos to Album</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              {allImages.map((image) => (
                <div
                  key={image.id}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                    selectedImages.some(img => img.id === image.id)
                      ? 'border-blue-500'
                      : 'border-transparent'
                  }`}
                  onClick={() => {
                    setSelectedImages(prev =>
                      prev.some(img => img.id === image.id)
                        ? prev.filter(img => img.id !== image.id)
                        : [...prev, image]
                    )
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.caption || 'Image'}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddImages}
                disabled={selectedImages.length === 0 || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add ${selectedImages.length} Photo${selectedImages.length === 1 ? '' : 's'}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AlbumPage({ params }: { params: { id: string } }) {
  const [album, setAlbum] = useState<AlbumType | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchAlbum = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push('/login')
        return
      }

      const albumData = await getAlbumById(params.id)
      if (!albumData) {
        router.push('/albums')
        return
      }
      setAlbum(albumData)
    } catch (error) {
      console.error("Error loading album:", error)
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        router.push('/login')
      } else {
        router.push('/albums')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlbum()
  }, [params.id, router])

  const handleAlbumUpdate = (updatedAlbum: AlbumType) => {
    setAlbum(updatedAlbum)
  }

  const handleImagesAdded = () => {
    fetchAlbum() // Refresh album data after adding images
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }

  if (!album) {
    return null
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {album.coverImage && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${album.coverImage}`}
                  alt={album.name}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold text-white">{album.name}</h1>
              <p className="text-purple-200 mt-2">{album.imageCount} photos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AddImagesDialog albumId={params.id} onImagesAdded={handleImagesAdded} />
            <AlbumActions album={album} onUpdate={handleAlbumUpdate} />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          }
        >
          <AlbumImages albumId={params.id} />
        </Suspense>
      </section>
    </div>
  )
}

function AlbumImages({ albumId }: { albumId: string }) {
  const [images, setImages] = useState<ImageType[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          router.push('/login')
          return
        }

        const imagesData = await getImagesByAlbumId(albumId)
        setImages(imagesData)
      } catch (error) {
        console.error("Error loading images:", error)
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [albumId, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }

  return <ImageGrid images={images} />
}
