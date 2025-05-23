"use client"

import type React from "react"

import Image from "next/image"
import { useState } from "react"
import type { ImageType } from "@/lib/types"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, X, Check, Download, Calendar, Info, ImageIcon, Tag, Users, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { detectFacesInImage, updatePersonName, deleteImage } from "@/lib/data"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ImageGrid({ images }: { images: ImageType[] }) {
  const { isAuthenticated } = useAuth()
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isDetectingFaces, setIsDetectingFaces] = useState(false)
  const [editingPersonName, setEditingPersonName] = useState<{ id: string; name: string } | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const selectedIndex = selectedImage ? images.findIndex((img) => img.id === selectedImage.id) : -1
  const { toast } = useToast()

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedImage(images[selectedIndex - 1])
    }
  }

  const handleNext = () => {
    if (selectedIndex < images.length - 1) {
      setSelectedImage(images[selectedIndex + 1])
    }
  }

  const toggleSelection = (imageId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    const newSelectedImages = new Set(selectedImages)
    if (newSelectedImages.has(imageId)) {
      newSelectedImages.delete(imageId)
    } else {
      newSelectedImages.add(imageId)
    }
    setSelectedImages(newSelectedImages)
  }

  const handleAddToAlbum = async () => {
    if (selectedImages.size === 0) return

    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      // This would be replaced with an actual API call
      toast({
        title: "Added to album",
        description: `${selectedImages.size} images added to album`,
      })
      setSelectedImages(new Set())
      setIsSelectionMode(false)
    } catch (error) {
      toast({
        title: "Failed to add to album",
        description: "There was an error adding images to album",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (image: ImageType) => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      // Create a link element
      const link = document.createElement("a")
      link.href = image.url

      // Extract filename from pathname or use image ID
      const filename = image.pathname.split("/").pop() || `image-${image.id}.jpg`
      link.download = filename

      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: "Your image download has started",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading the image",
        variant: "destructive",
      })
    }
  }

  const handleSelectModeToggle = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    setIsSelectionMode(!isSelectionMode)
    if (!isSelectionMode) {
      setSelectedImages(new Set())
    }
  }

  const handleDetectFaces = async (imageId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      setIsDetectingFaces(true)
      await detectFacesInImage(imageId)
      toast({
        title: "Face detection started",
        description: "We're analyzing the image for faces. This may take a few moments.",
      })
    } catch (error) {
      console.error("Face detection error:", error)
      toast({
        title: "Error",
        description: "Failed to start face detection",
        variant: "destructive",
      })
    } finally {
      setIsDetectingFaces(false)
    }
  }

  const handleUpdatePersonName = async (personId: string, newName: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      await updatePersonName(personId, newName)
      toast({
        title: "Name updated",
        description: "Person name has been updated successfully",
      })
      setEditingPersonName(null)
    } catch (error) {
      console.error("Update name error:", error)
      toast({
        title: "Error",
        description: "Failed to update person name",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedImage) return

    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      setIsDeleting(true)
      await deleteImage(selectedImage.id)
      toast({
        title: "Image deleted",
        description: "The image has been deleted successfully",
      })
      setSelectedImage(null)
      setShowDeleteDialog(false)
      // Refresh the page to update the image list
      window.location.reload()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting the image",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return

    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      setIsDeleting(true)
      // Delete all selected images
      await Promise.all(Array.from(selectedImages).map(id => deleteImage(id)))
      toast({
        title: "Images deleted",
        description: `${selectedImages.size} images have been deleted successfully`,
      })
      setSelectedImages(new Set())
      setIsSelectionMode(false)
      // Refresh the page to update the image list
      window.location.reload()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting the images",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-300 text-lg">No images found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <Button variant="outline" onClick={handleSelectModeToggle} className="border-gray-700 text-gray-900 dark:text-white">
          {isSelectionMode ? "Cancel Selection" : "Select Images"}
        </Button>

        {isSelectionMode && (
          <div className="flex gap-2">
            <Button
              onClick={handleAddToAlbum}
              disabled={selectedImages.size === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add to Album ({selectedImages.size})
            </Button>
            <Button
              onClick={handleDeleteSelected}
              disabled={selectedImages.size === 0 || isDeleting}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedImages.size})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 scrollbar-hide">
        {images.map((image) => (
          <div
            key={image.id}
            className="aspect-square relative rounded-md overflow-hidden cursor-pointer"
            onClick={() => !isSelectionMode && setSelectedImage(image)}
          >
            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.caption || "Image"}
              fill
              className="object-cover transition-transform duration-300 hover:scale-110"
            />

            {isSelectionMode && (
              <div
                className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedImages.has(image.id) ? "bg-blue-500 text-white" : "bg-black/50 text-white border border-white"
                }`}
                onClick={(e) => toggleSelection(image.id, e)}
              >
                {selectedImages.has(image.id) && <Check className="h-4 w-4" />}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedImage(null)
            setShowDetails(false)
          }
        }}
      >
        <DialogContent className="max-w-5xl w-[90vw] h-[90vh] p-0 bg-black border-gray-700 scrollbar-hide">
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedImage && (
              <Image
                src={selectedImage.url || "/placeholder.svg"}
                alt={selectedImage.caption || "Image"}
                fill
                className="object-contain"
              />
            )}

            {/* Top controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-black/50"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      <Info className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle image details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {selectedImage && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-black/50"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete image</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-black/50"
                      onClick={() => setSelectedImage(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Navigation controls */}
            {selectedIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-black/50"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {selectedIndex < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-black/50"
                onClick={handleNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image details panel */}
            {selectedImage && showDetails && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 space-y-3 backdrop-blur-sm overflow-y-auto max-h-[40%] scrollbar-hide">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Image Details</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-black/50 h-8 px-2"
                      onClick={() => handleDownload(selectedImage)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {selectedImage.caption && (
                      <div className="flex items-start gap-2">
                        <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-400">Caption</p>
                          <p className="text-white">{selectedImage.caption}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-400">Upload Date</p>
                        <p className="text-white">{format(selectedImage.createdAt, "PPP p")}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <ImageIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-400">File</p>
                        <p className="text-white">{selectedImage.pathname.split("/").pop()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedImage.peopleIds.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-400">People</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedImage.peopleIds.map((personId) => (
                              <Badge key={personId} className="bg-blue-600">
                                Person {personId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedImage.albumIds.length > 0 && (
                      <div className="flex items-start gap-2">
                        <ImageIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-400">Albums</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedImage.albumIds.map((albumId) => (
                              <Badge key={albumId} className="bg-red-600">
                                Album {albumId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedImage.peopleIds && selectedImage.peopleIds.length > 0 && (
                  <div className="col-span-2 space-y-4">
                    <h3 className="text-lg font-medium text-white">People in this image</h3>
                    <div className="space-y-2">
                      {selectedImage.peopleIds.map((personId) => {
                        const person = selectedImage.people?.find(p => p.id === personId)
                        return (
                          <div key={personId} className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-gray-400" />
                            {editingPersonName?.id === personId ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingPersonName.name}
                                  onChange={(e) =>
                                    setEditingPersonName({ ...editingPersonName, name: e.target.value })
                                  }
                                  className="bg-gray-800 border-gray-700 text-white"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdatePersonName(personId, editingPersonName.name)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingPersonName(null)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-white">{person?.name || `Person ${personId}`}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingPersonName({ id: personId, name: person?.name || `Person ${personId}` })}
                                  className="text-gray-400 hover:text-white"
                                >
                                  Edit Name
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Caption (when details are not shown) */}
            {selectedImage?.caption && !showDetails && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4">
                <p className="text-white">{selectedImage.caption}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultTab="login" />
    </>
  )
}
