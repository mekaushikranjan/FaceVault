"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import type { User, ImageType } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { getImagesByPersonId } from "@/lib/data"

interface HorizontalPeopleCardProps {
  person: User
}

export default function HorizontalPeopleCard({ person }: HorizontalPeopleCardProps) {
  const { isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [recentImage, setRecentImage] = useState<string | null>(null)
  const [imageCount, setImageCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPersonImages = async () => {
      try {
        const images = await getImagesByPersonId(person.id)
        if (images.length > 0) {
          // Sort images by creation date and get the most recent one
          const latestImage = images.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
          setRecentImage(latestImage.url)
        }
        setImageCount(images.length)
      } catch (error) {
        console.error(`Error loading images for person ${person.id}:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPersonImages()
  }, [person.id])

  const handleClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault()
      setShowAuthModal(true)
    }
  }

  return (
    <>
      <Link href={`/people/${person.id}`} className="flex-shrink-0 w-40 mx-2" onClick={handleClick}>
        <div className="aspect-square relative rounded-full overflow-hidden mb-2 border-2 border-transparent hover:border-blue-500 transition-colors">
          {recentImage ? (
            <Image 
              src={recentImage} 
              alt={person.name} 
              fill 
              className="object-cover"
            />
          ) : person.avatarUrl ? (
            <Image src={person.avatarUrl || "/placeholder.svg"} alt={person.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <span className="text-4xl text-gray-400">{person.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="text-center">
          <h3 className="text-sm font-medium text-white truncate hover:text-blue-400 transition-colors">
            {person.name}
          </h3>
          <p className="text-xs text-gray-400">
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              `${imageCount} photos`
            )}
          </p>
        </div>
      </Link>

      {/* Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultTab="login" />
    </>
  )
}
