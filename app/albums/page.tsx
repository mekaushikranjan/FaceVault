"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import AlbumGrid from "@/components/album-grid"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAllAlbums } from "@/lib/data"
import { getDummyAlbums } from "@/lib/dummy-data"
import { AuthModal } from "@/components/auth-modal"
import { Album } from "@/lib/types"
import CreateAlbumDialog from "@/components/create-album-dialog"

export default function AlbumsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (isAuthenticated) {
          // Fetch real data for authenticated users
          const albumsData = await getAllAlbums()
          setAlbums(albumsData)
        } else {
          // Use dummy data for non-authenticated users
          setAlbums(getDummyAlbums())
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

  const handleAlbumCreated = (newAlbum: Album) => {
    setAlbums((prevAlbums) => [newAlbum, ...prevAlbums])
  }

  return (
    <div className="space-y-8 scrollbar-hide px-4 sm:px-6 lg:px-8">
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Albums</h1>
            <p className="text-muted-foreground mt-2">Automatically generated albums based on your photos</p>
          </div>
          {isAuthenticated ? (
            <Button onClick={() => setShowCreateDialog(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-5 w-5 mr-2" />
              Create Album
            </Button>
          ) : (
            <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-5 w-5 mr-2" />
              Create Album
            </Button>
          )}
        </div>
      </section>

      <section className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <AlbumGrid albums={albums} requiresAuth={!isAuthenticated} />
        )}
      </section>

      {/* Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultTab="login" />

      {/* Create Album Dialog */}
      <CreateAlbumDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onAlbumCreated={handleAlbumCreated}
      />
    </div>
  )
}
