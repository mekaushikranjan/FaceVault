"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Loader2 } from "lucide-react"
import { upload } from "@vercel/blob/client"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function UploadForm() {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(selectedFiles)

      // Create previews
      const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file))
      setPreviews(newPreviews)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setProgress(0)

    try {
      const totalFiles = files.length
      let completedFiles = 0

      for (const file of files) {
        // Upload to Vercel Blob
        await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        })

        completedFiles++
        setProgress(Math.round((completedFiles / totalFiles) * 100))
      }

      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${files.length} images`,
      })

      // Reset form
      setFiles([])
      setPreviews([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your images",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-800/30 transition-colors h-80 flex flex-col items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept="image/*"
              />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-white">Drag photos here or click to browse</h3>
                <p className="text-gray-300 max-w-md">
                  Upload multiple photos to automatically organize them by faces and create albums
                </p>
              </div>
            </div>

            {previews.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Selected Photos ({previews.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-80 overflow-y-auto p-2 scrollbar-hide">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-800 group">
                      <Image
                        src={preview || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-110"
                      />
                      <div
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Remove this file from the selection
                          const newFiles = [...files]
                          newFiles.splice(index, 1)
                          setFiles(newFiles)

                          const newPreviews = [...previews]
                          URL.revokeObjectURL(newPreviews[index])
                          newPreviews.splice(index, 1)
                          setPreviews(newPreviews)
                        }}
                      >
                        <Button variant="ghost" size="sm" className="text-white hover:bg-red-500/20">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isUploading ? (
              <div className="space-y-3">
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Uploading {progress}%</span>
                  <Loader2 className="h-5 w-5 text-gray-300 animate-spin" />
                </div>
              </div>
            ) : (
              <Button
                onClick={handleUpload}
                disabled={files.length === 0}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload {files.length > 0 ? `${files.length} Photos` : "Photos"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
