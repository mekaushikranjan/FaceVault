"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Check, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface FileWithPreview extends File {
  preview: string
  id: string
  mongoId?: string
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [detectFaces, setDetectFaces] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Check file size limit (10MB)
      const validFiles = acceptedFiles.filter((file) => file.size <= 10 * 1024 * 1024)
      const oversizedFiles = acceptedFiles.filter((file) => file.size > 10 * 1024 * 1024)

      if (oversizedFiles.length > 0) {
        toast({
          title: "File size exceeded",
          description: `${oversizedFiles.length} files exceed the 10MB limit and were not added`,
          variant: "destructive",
        })
      }

      // Add new files with preview
      const newFiles = validFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
          id: Math.random().toString(36).substring(2, 11),
          status: "pending" as const,
          progress: 0,
        }),
      )

      setFiles((prev) => [...prev, ...newFiles])
    },
    [toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = (id: string) => {
    setFiles((files) => {
      const fileToRemove = files.find((file) => file.id === id)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return files.filter((file) => file.id !== id)
    })
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setOverallProgress(0)

    // Update file statuses to uploading
    setFiles((files) => files.map((file) => ({ ...file, status: "uploading" as const })))

    let completedFiles = 0
    let successfulFiles = 0

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append("file", file, file.name)
        formData.append("caption", "")
        formData.append("detect_faces", detectFaces.toString())

        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.detail || `Upload failed: ${response.statusText}`)
        }

        const data = await response.json()
        // Store the MongoDB ID after successful upload
        setFiles((files) =>
          files.map((f) => (f.id === file.id ? { ...f, status: "success" as const, progress: 100, mongoId: data._id } : f)),
        )

        successfulFiles++
      } catch (error) {
        console.error("Upload error:", error)
        // Mark file as failed
        setFiles((files) =>
          files.map((f) => (f.id === file.id ? { ...f, status: "error" as const, error: "Upload failed" } : f)),
        )
      }

      completedFiles++
      setOverallProgress(Math.round((completedFiles / files.length) * 100))
    }

    setIsUploading(false)

    // Show success message
    toast({
      title: "Upload complete",
      description: `Successfully uploaded ${successfulFiles} of ${files.length} images`,
      variant: successfulFiles === files.length ? "default" : "destructive",
    })

    // Show confirmation dialog for face detection if not already enabled
    if (successfulFiles > 0 && !detectFaces) {
      setShowConfirmDialog(true)
    } else {
      // Redirect to main page after a short delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    }
  }

  const handleConfirmFaceDetection = async () => {
    try {
      // Start face detection process
      toast({
        title: "Face detection started",
        description: "We're analyzing your photos for faces. This may take a few minutes.",
      })

      // Get all successful file IDs
      const successfulFiles = files.filter(file => file.status === "success")
      
      // Trigger face detection for each successful file
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      for (const file of successfulFiles) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${file.id}/detect-faces`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            console.error(`Face detection failed for file ${file.name}`)
          }
        } catch (error) {
          console.error(`Error detecting faces in ${file.name}:`, error)
        }
      }

      setShowConfirmDialog(false)

      // Clear successful files
      setFiles((files) => files.filter((file) => file.status !== "success"))

      // Redirect to main page after a short delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Face detection error:", error)
      toast({
        title: "Error",
        description: "Failed to start face detection",
        variant: "destructive",
      })
    }
  }

  // Add new function to detect faces for a specific image
  const detectFacesForImage = async (imageId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      // Find the file with this ID and use its MongoDB ID if available
      const file = files.find(f => f.id === imageId)
      if (!file?.mongoId) {
        throw new Error("Image not found or not uploaded")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${file.mongoId}/detect-faces`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Face detection failed")
      }

      toast({
        title: "Face detection started",
        description: "We're analyzing your photo for faces. This may take a few minutes.",
      })
    } catch (error) {
      console.error("Face detection error:", error)
      toast({
        title: "Error",
        description: "Failed to start face detection",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8 py-4 sm:py-6 md:py-8">
      <section className="space-y-4 max-w-3xl mx-auto px-4 sm:px-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Upload Photos</h1>
          <p className="text-muted-foreground mt-2">Upload your photos to be automatically organized by faces</p>
        </div>
      </section>

      <section className="px-4 sm:px-6">
        <div className="w-full max-w-3xl mx-auto">
          <Card className="bg-background border-border">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors h-80 flex flex-col items-center justify-center ${
                    isDragActive ? "border-primary bg-primary/10" : "border-border hover:bg-muted/30"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isDragActive ? "bg-primary/20" : "bg-muted"
                      }`}
                    >
                      <Upload className={`h-8 w-8 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <h3 className="text-xl font-medium text-foreground">
                      {isDragActive ? "Drop photos here" : "Drag photos here or click to browse"}
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Upload multiple photos to automatically organize them by faces and create albums
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, PNG, WebP • Max size: 10MB per image
                    </p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-foreground">Selected Files</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="detect-faces"
                            checked={detectFaces}
                            onChange={(e) => setDetectFaces(e.target.checked)}
                            className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="detect-faces" className="text-sm text-gray-300">
                            Detect faces during upload
                          </label>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFiles([])}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background"
                        >
                          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={file.preview}
                              alt={file.name}
                              fill
                              className="object-cover"
                              onLoad={() => URL.revokeObjectURL(file.preview)}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                              <div className="flex items-center gap-2">
                                {file.status === "success" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => detectFacesForImage(file.id)}
                                    className="text-primary hover:text-primary/90"
                                  >
                                    Detect Faces
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFile(file.id)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress value={file.progress} className="h-2" />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {file.status === "uploading" && (
                                <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                              )}
                              {file.status === "success" && <Check className="h-3 w-3 text-primary" />}
                              {file.status === "error" && <AlertCircle className="h-3 w-3 text-destructive" />}
                              <p className="text-xs text-muted-foreground">
                                {file.status === "error" ? file.error : `${file.progress}%`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Progress value={overallProgress} className="w-32 h-2" />
                        <span className="text-sm text-muted-foreground">{overallProgress}%</span>
                      </div>
                      <Button
                        onClick={uploadFiles}
                        disabled={isUploading || files.length === 0}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Upload All"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Upload Tips</h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Upload multiple photos at once to save time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Photos with faces will be automatically grouped by person</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Supported formats: JPG, PNG, WebP</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Maximum file size: 10MB per image</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Face Detection Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Start Face Detection?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Would you like to start analyzing your uploaded photos for faces? This process may take a few minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmFaceDetection}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Start Detection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
