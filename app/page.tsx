"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import HorizontalScroll from "@/components/horizontal-scroll"
import HorizontalPeopleCard from "@/components/horizontal-people-card"
import HorizontalAlbumCard from "@/components/horizontal-album-card"
import ImageGrid from "@/components/image-grid"
import UploadButton from "@/components/upload-button"
import { Loader2, Users, FolderOpen, ImageIcon, Camera } from "lucide-react"
import Link from "next/link"
import { StatsCard } from "@/components/stats-card"
import { AuthModal } from "@/components/auth-modal"
import { Button } from "@/components/ui/button"
import { getDummyPeople, getDummyAlbums, getDummyImages } from "@/lib/dummy-data"
import { getAllPeople, getAllAlbums, getAllImages } from "@/lib/data"
import { User, Album, ImageType } from "@/lib/types"

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")

  const [people, setPeople] = useState<User[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [images, setImages] = useState<ImageType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [storageInfo, setStorageInfo] = useState<{ used: number; limit: number; used_percentage: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const elementsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (isAuthenticated) {
          // Fetch real data for authenticated users
          const [peopleData, albumsData, imagesData] = await Promise.all([
            getAllPeople(),
            getAllAlbums(),
            getAllImages()
          ])

          setPeople(peopleData)
          setAlbums(albumsData)
          setImages(imagesData)

          // Fetch storage info
          const storageResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/storage`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
          if (storageResponse.ok) {
            const storageData = await storageResponse.json()
            setStorageInfo(storageData)
          }
        } else {
          // Use dummy data for non-authenticated users
          setPeople(getDummyPeople())
          setAlbums(getDummyAlbums())
          setImages(getDummyImages())
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      fetchData()
    }
  }, [isAuthenticated, authLoading])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      
      // Calculate mouse position relative to container center
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)

      // Apply different transform intensities to each element
      elementsRef.current.forEach((element, index) => {
        if (!element) return
        
        // Different multipliers for each element to create depth
        const multipliers = [0.05, 0.08, 0.12]
        const multiplier = multipliers[index] || 0.05
        
        // Calculate diagonal movement by combining x and y
        const diagonalX = (x + y) * 20 * multiplier
        const diagonalY = (x - y) * 20 * multiplier
        const rotate = (x * y * 5 * multiplier)

        // Get current scroll-based transform
        const scrollTransform = element.getAttribute('data-scroll-transform') || ''
        
        // Combine mouse and scroll transforms with diagonal movement
        element.style.transform = `${scrollTransform} translate(${diagonalX}px, ${diagonalY}px) rotate(${rotate}deg)`
      })
    }

    const handleMouseLeave = () => {
      elementsRef.current.forEach((element) => {
        if (!element) return
        // Restore only scroll transform when mouse leaves
        const scrollTransform = element.getAttribute('data-scroll-transform') || ''
        element.style.transform = scrollTransform
      })
    }

    const handleScroll = () => {
      elementsRef.current.forEach((element, index) => {
        if (!element) return
        
        const rect = element.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        
        // Calculate how far the element is from the center of the viewport
        const distanceFromCenter = (rect.top + rect.height / 2) - (viewportHeight / 2)
        
        // Calculate scroll-based transform
        const scrollMultipliers = [0.1, 0.15, 0.2]
        const scrollMultiplier = scrollMultipliers[index] || 0.1
        
        const translateY = -distanceFromCenter * scrollMultiplier
        const rotate = (distanceFromCenter / viewportHeight) * 10 * scrollMultiplier
        
        // Store scroll transform for combining with mouse movement
        const scrollTransform = `translateY(${translateY}px) rotate(${rotate}deg)`
        element.setAttribute('data-scroll-transform', scrollTransform)
        
        // Apply transform if no mouse movement is active
        if (!element.matches(':hover')) {
          element.style.transform = scrollTransform
        }
      })
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', handleMouseLeave)
      window.addEventListener('scroll', handleScroll)
      
      // Initial scroll position
      handleScroll()
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseleave', handleMouseLeave)
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  const handleLoginClick = () => {
    setActiveTab("login")
    setShowAuthModal(true)
  }

  const handleRegisterClick = () => {
    setActiveTab("register")
    setShowAuthModal(true)
  }

  const formatBytes = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB", "TB"]
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background to-muted rounded-lg overflow-hidden mb-12">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px] opacity-10"></div>
        <div className="container mx-auto px-4 py-8 sm:py-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-2xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
                <span className="text-primary">Face</span>
                <span className="text-foreground">Vault</span>
                
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Automatically organize your photos by faces with advanced AI detection. Keep your memories organized and
                easily accessible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {!isAuthenticated ? (
                  <>
                    <Button
                      onClick={handleLoginClick}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg"
                    >
                      Login
                    </Button>
                    <Button
                      onClick={handleRegisterClick}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10 px-8 py-6 text-lg"
                    >
                      Sign Up
                    </Button>
                  </>
                ) : (
                  <UploadButton size="lg" />
                )}
              </div>
            </div>
            <div className="relative w-full max-w-md" ref={containerRef}>
              <div 
                ref={el => { elementsRef.current[0] = el }}
                className="aspect-square rounded-lg overflow-hidden bg-muted border-4 border-border shadow-2xl transform rotate-3 transition-all duration-500 ease-out"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="h-24 w-24 text-muted-foreground" />
                </div>
              </div>
              <div 
                ref={el => { elementsRef.current[1] = el }}
                className="absolute -bottom-4 -left-4 aspect-square w-2/3 rounded-lg overflow-hidden bg-muted border-4 border-border shadow-2xl transform -rotate-6 transition-all duration-500 ease-out"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="h-16 w-16 text-muted-foreground" />
                </div>
              </div>
              <div 
                ref={el => { elementsRef.current[2] = el }}
                className="absolute -top-4 -right-4 aspect-square w-1/2 rounded-lg overflow-hidden bg-muted border-4 border-border shadow-2xl transform rotate-12 transition-all duration-500 ease-out"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Stats Section */}
      {!isLoading && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-0">
          <div className="bg-background rounded-lg p-4 sm:p-6 border border-border hover:border-primary transition-colors">
            <StatsCard
              title="Total Photos"
              value={images.length.toString()}
              icon={<ImageIcon className="h-5 w-5 text-primary" />}
              description="Photos in your gallery"
            />
          </div>
          <div className="bg-background rounded-lg p-4 sm:p-6 border border-border hover:border-primary transition-colors">
            <StatsCard
              title="People"
              value={people.length.toString()}
              icon={<Users className="h-5 w-5 text-primary" />}
              description="Detected in your photos"
            />
          </div>
          <div className="bg-background rounded-lg p-4 sm:p-6 border border-border hover:border-primary transition-colors">
            <StatsCard
              title="Albums"
              value={albums.length.toString()}
              icon={<FolderOpen className="h-5 w-5 text-primary" />}
              description="Organized collections"
            />
          </div>
          <div className="bg-background rounded-lg p-4 sm:p-6 border border-border hover:border-primary transition-colors">
            <StatsCard
              title="Storage Used"
              value={isAuthenticated ? formatBytes(storageInfo?.used || 0) : "2.0 GB"}
              icon={<ImageIcon className="h-5 w-5 text-primary" />}
              description={isAuthenticated ? `Of ${formatBytes(storageInfo?.limit || 0)} total` : "Of 15.0 GB total"}
              progress={isAuthenticated ? storageInfo?.used_percentage || 0 : 13.33}
              showUpgradeButton={true}
            />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="mb-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background rounded-lg p-6 border border-border hover:border-primary transition-colors">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Face Detection</h3>
              <p className="text-muted-foreground">
                Automatically detect and group faces in your photos for easy organization.
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 border border-border hover:border-primary transition-colors">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Smart Albums</h3>
              <p className="text-muted-foreground">
                Create and organize albums automatically based on people, dates, and locations.
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 border border-border hover:border-primary transition-colors">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Secure Storage</h3>
              <p className="text-muted-foreground">
                Keep your photos safe with secure cloud storage and easy access from any device.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* People Section */}
      <section className="space-y-4 px-4 sm:px-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">People</h2>
          </div>
          <Link href="/people" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <>
            {people.length > 0 ? (
              <div className="relative">
                <HorizontalScroll>
                  {people.map((person) => (
                    <HorizontalPeopleCard key={person.id} person={person} />
                  ))}
                </HorizontalScroll>
              </div>
            ) : (
              <div className="bg-background rounded-lg p-6 text-center border border-border">
                <p className="text-muted-foreground">No people found. Upload some photos to get started.</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Albums Section */}
      <section className="space-y-4 px-4 sm:px-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Albums</h2>
          </div>
          <Link href="/albums" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <>
            {albums.length > 0 ? (
              <div className="relative">
                <HorizontalScroll>
                  {albums.map((album) => (
                    <HorizontalAlbumCard key={album.id} album={album} />
                  ))}
                </HorizontalScroll>
              </div>
            ) : (
              <div className="bg-background rounded-lg p-6 text-center border border-border">
                <p className="text-muted-foreground">No albums found. Upload some photos to get started.</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Recent Photos Section */}
      <section className="space-y-4 px-4 sm:px-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Recent Photos</h2>
          </div>
          <Link href="/images" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <div className="bg-background rounded-lg border border-border p-4 sm:p-6">
            <ImageGrid images={images.slice(0, 10)} />
          </div>
        )}
      </section>

      {/* Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultTab={activeTab} />
    </div>
  )
}
