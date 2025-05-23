"use client"

import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface UploadButtonProps {
  size?: "default" | "sm" | "lg"
  className?: string
}

export default function UploadButton({ size = "default", className }: UploadButtonProps) {
  const { isAuthenticated } = useAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const buttonClasses = cn("bg-red-600 hover:bg-red-700 text-white", size === "lg" && "text-lg py-6 px-8", className)

  if (isAuthenticated) {
    return (
      <Button asChild className={buttonClasses} size={size === "lg" ? "lg" : size}>
        <Link href="/upload" className="flex items-center gap-2">
          <Upload className={cn("h-5 w-5", size === "lg" && "h-6 w-6")} />
          Upload Photos
        </Link>
      </Button>
    )
  }

  return (
    <>
      <Button onClick={() => setShowLoginDialog(true)} className={buttonClasses} size={size === "lg" ? "lg" : size}>
        <Upload className={cn("h-5 w-5 mr-2", size === "lg" && "h-6 w-6")} />
        Upload Photos
      </Button>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription className="text-gray-400">
              You need to be logged in to upload photos. Please login or create an account to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginDialog(false)} className="border-gray-700">
              Cancel
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/login">Login or Register</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
