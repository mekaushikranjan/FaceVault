"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import type { User, ImageType } from "@/lib/types"
import { AuthModal } from "@/components/auth-modal"
import { getImagesByPersonId } from "@/lib/data"

interface PeopleGridProps {
  people: User[]
  emptyMessage?: string
  requiresAuth?: boolean
}

export default function PeopleGrid({
  people,
  emptyMessage = "No people found. Upload some photos or fetch your gallery to get started.",
  requiresAuth = false,
}: PeopleGridProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [personImages, setPersonImages] = useState<Record<string, { url: string; count: number }>>({})

  useEffect(() => {
    const loadPersonImages = async () => {
      const images: Record<string, { url: string; count: number }> = {}
      
      for (const person of people) {
        try {
          const personImages = await getImagesByPersonId(person.id)
          if (personImages.length > 0) {
            // Sort images by creation date and get the most recent one
            const latestImage = personImages.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0]
            images[person.id] = {
              url: latestImage.url,
              count: personImages.length
            }
          }
        } catch (error) {
          console.error(`Error loading images for person ${person.id}:`, error)
        }
      }
      
      setPersonImages(images)
    }

    loadPersonImages()
  }, [people])

  const handlePersonClick = (personId: string, e: React.MouseEvent) => {
    if (requiresAuth) {
      e.preventDefault()
      setSelectedPersonId(personId)
      setShowAuthModal(true)
    }
  }

  if (people.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-300 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/people/${person.id}`}
            onClick={(e) => handlePersonClick(person.id, e)}
            className={requiresAuth ? "cursor-pointer" : ""}
          >
            <Card className="bg-black border-gray-700 overflow-hidden hover:border-white/20 transition-colors">
              <div className="aspect-square relative">
                {personImages[person.id]?.url ? (
                  <Image 
                    src={personImages[person.id].url} 
                    alt={person.name} 
                    fill 
                    className="object-cover"
                  />
                ) : person.avatarUrl ? (
                  <Image 
                    src={person.avatarUrl} 
                    alt={person.name} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <span className="text-4xl text-gray-400">{person.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium text-white truncate">{person.name}</h3>
                <p className="text-gray-300 text-sm">
                  {personImages[person.id]?.count || 0} photos
                </p>
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
