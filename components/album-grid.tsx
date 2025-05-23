"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import type { Album, ImageType } from "@/lib/types"
import { AuthModal } from "@/components/auth-modal"
import { getImagesByAlbumId } from "@/lib/data"

interface AlbumGridProps {
  albums: Album[]
  emptyMessage?: string
  requiresAuth?: boolean
}

export default function AlbumGrid({
  albums,
  emptyMessage = "No albums found. Upload some photos or fetch your gallery to get started.",
  requiresAuth = false,
}: AlbumGridProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const [albumCovers, setAlbumCovers] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadAlbumCovers = async () => {
      const covers: Record<string, string> = {}
      
      for (const album of albums) {
        try {
          const images = await getImagesByAlbumId(album.id)
          if (images.length > 0) {
            // Sort images by creation date and get the most recent one
            const latestImage = images.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0]
            covers[album.id] = latestImage.url
          }
        } catch (error) {
          console.error(`Error loading images for album ${album.id}:`, error)
        }
      }
      
      setAlbumCovers(covers)
    }

    loadAlbumCovers()
  }, [albums])

  const handleAlbumClick = (albumId: string, e: React.MouseEvent) => {
    if (requiresAuth) {
      e.preventDefault()
      setSelectedAlbumId(albumId)
      setShowAuthModal(true)
    }
  }

  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-300 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {albums.map((album) => (
          <Link
            key={album.id}
            href={`/albums/${album.id}`}
            onClick={(e) => handleAlbumClick(album.id, e)}
            className={requiresAuth ? "cursor-pointer" : ""}
          >
            <Card className="bg-black border-gray-700 overflow-hidden hover:border-white/20 transition-colors">
              <div className="aspect-video relative">
                {albumCovers[album.id] ? (
                  <Image 
                    src={albumCovers[album.id]} 
                    alt={album.name} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <span className="text-2xl text-gray-400">{album.name}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium text-white truncate">{album.name}</h3>
                <p className="text-gray-300 text-sm">{album.imageCount} photos</p>
                {album.description && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{album.description}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultTab="login" />
    </>
  )
}
