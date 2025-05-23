"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Users, Download } from "lucide-react"
import { getAllPeople, getImagesByPersonId, getAllImages } from "@/lib/data"
import { User, ImageType } from "@/lib/types"
import Link from "next/link"
import { AuthModal } from "@/components/auth-modal"
import { getDummyPeople } from "@/lib/dummy-data"
import Image from "next/image"

export default function PeoplePage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [people, setPeople] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isDetectingFaces, setIsDetectingFaces] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<User | null>(null)
  const [images, setImages] = useState<ImageType[]>([])
  const [personImages, setPersonImages] = useState<Record<string, string>>({})

  const loadPeople = async () => {
    setIsLoading(true);
    try {
      const peopleData = await getAllPeople()
      setPeople(peopleData)
      
      // Load latest image for each person
      for (const person of peopleData) {
        try {
          const personImages = await getImagesByPersonId(person.id)
          if (personImages.length > 0) {
            // Sort images by creation date and get the latest one
            const latestImage = personImages.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0]
            setPersonImages(prev => ({
              ...prev,
              [person.id]: latestImage.url
            }))
            // Update the person's image count with the actual number of images
            setPeople(prev => prev.map(p => 
              p.id === person.id ? { ...p, imageCount: personImages.length } : p
            ))
          }
        } catch (error) {
          console.error(`Error loading images for person ${person.id}:`, error)
        }
      }
    } catch (error) {
      console.error("Error loading people:", error)
      toast({
        title: "Error",
        description: "Failed to load people",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadPeople()
    } else {
      setPeople(getDummyPeople())
      setIsLoading(false);
    }
  }, [isAuthenticated])

  const handleDetectFaces = async () => {
    if (!isAuthenticated) return;
    
    setIsDetectingFaces(true);
    try {
      // Get all images that need face detection
      const allImages = await getAllImages();
      const imagesNeedingDetection = allImages.filter((img: ImageType) => !img.faceDetections || img.faceDetections.length === 0);
      
      if (imagesNeedingDetection.length === 0) {
        toast({
          title: "No images need detection",
          description: "All images already have faces detected.",
          variant: "default"
        });
        return;
      }

      let processedCount = 0;
      let skippedCount = 0;

      // Process each image
      for (const image of imagesNeedingDetection) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/images/${image.id}/detect-faces`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to detect faces');
          }

          const data = await response.json();
          
          if (data.skipped) {
            skippedCount++;
          } else {
            processedCount++;
          }
        } catch (error) {
          console.error('Error detecting faces for image:', image.id, error);
        }
      }

      toast({
        title: "Face detection completed",
        description: `Processed ${processedCount} images, skipped ${skippedCount} images.`,
        variant: "default"
      });

      // Refresh the people list
      loadPeople();
    } catch (error) {
      console.error('Error detecting faces:', error);
      toast({
        title: "Error",
        description: "Failed to detect faces",
        variant: "destructive"
      });
    } finally {
      setIsDetectingFaces(false);
    }
  };

  const handlePersonClick = (personId: string) => {
    router.push(`/people/${personId}`)
  }

  return (
    <div className="space-y-8 scrollbar-hide px-4 sm:px-6 lg:px-8">
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">People</h1>
            <p className="text-muted-foreground mt-2">All the people detected in your photos</p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={handleDetectFaces}
                  disabled={isDetectingFaces}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isDetectingFaces ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    "Detect Faces"
                  )}
                </Button>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/people/manage" className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Manage People
                  </Link>
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Users className="h-5 w-5 mr-2" />
                Manage People
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {people.map((person) => (
              <div 
                key={person.id} 
                className="relative group cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handlePersonClick(person.id)}
              >
                <div className="aspect-square relative overflow-hidden rounded-lg">
                  <Image
                    src={personImages[person.id] || person.avatarUrl || "/placeholder.png"}
                    alt={person.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-medium">{person.name}</h3>
                  <p className="text-sm text-muted-foreground">{person.imageCount} photos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultTab="login" />
    </div>
  )
}

