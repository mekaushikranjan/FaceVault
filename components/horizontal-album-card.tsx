"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import type { Album, ImageType } from "@/lib/types"
import { getImagesByAlbumId } from "@/lib/data"

interface HorizontalAlbumCardProps {
  album: Album
}

export default function HorizontalAlbumCard({ album }: HorizontalAlbumCardProps) {
  const [recentImage, setRecentImage] = useState<string | null>(null)
  const [imageCount, setImageCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAlbumImages = async () => {
      try {
        const images = await getImagesByAlbumId(album.id)
        if (images.length > 0) {
          // Sort images by creation date and get the most recent one
          const latestImage = images.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
          setRecentImage(latestImage.url)
        }
        setImageCount(images.length)
      } catch (error) {
        console.error(`Error loading images for album ${album.id}:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAlbumImages()
  }, [album.id])

  return (
    <Link href={`/albums/${album.id}`}>
      <Card className="w-[200px] bg-black border-gray-700 overflow-hidden hover:border-white/20 transition-colors">
        <div className="aspect-video relative">
          {recentImage ? (
            <Image 
              src={recentImage} 
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
          <p className="text-gray-300 text-sm">
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              `${imageCount} photos`
            )}
          </p>
          {album.description && (
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{album.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
