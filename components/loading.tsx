"use client"

import React, { useEffect, useState } from "react"

export default function LoadingScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Ensure loading screen stays visible for at least 500ms
    const timer = setTimeout(() => {
      setShow(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-background rounded-full"></div>
          </div>
        </div>
        <p className="text-lg font-medium text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  )
} 