"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  bio?: string
  profile_image?: string
  is_verified: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  verifyEmail: (email: string, otp: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsAuthenticated(false)
        setUser(null)
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to fetch user")
      }

      const userData = await response.json()
      setUser(userData)
      setIsAuthenticated(true)
      localStorage.setItem("user", JSON.stringify(userData))
    } catch (error) {
      console.error("Error fetching user:", error)
      setIsAuthenticated(false)
      setUser(null)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  // Handle protected routes
  useEffect(() => {
    if (isLoading) return

    const protectedRoutes = ["/upload", "/settings", "/albums", "/people"]
    const isProtectedRoute = protectedRoutes.some((route) => pathname?.startsWith(route))

    if (isProtectedRoute && !user) {
      router.push("/")
      toast({
        title: "Authentication required",
        description: "Please log in to access this page",
        variant: "destructive",
      })
    }

    if (isProtectedRoute && user && !user.is_verified) {
      router.push(`/verify-email?email=${encodeURIComponent(user.email)}`)
      toast({
        title: "Email verification required",
        description: "Please verify your email to access this page",
        variant: "destructive",
      })
    }
  }, [isLoading, user, pathname, router, toast])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Login failed")
      }

      const data = await response.json()
      localStorage.setItem("token", data.access_token)

      // Get user data
      const userResponse = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      })

      if (!userResponse.ok) {
        const error = await userResponse.json()
        throw new Error(error.detail || "Failed to get user data")
      }

      const userData = await userResponse.json()
      setUser(userData)
      setIsAuthenticated(true)
      localStorage.setItem("user", JSON.stringify(userData))

      toast({
        title: "Login successful",
        description: "Welcome back!",
      })

      // Redirect to verification if not verified
      if (!userData.is_verified) {
        router.push(`/verify-email?email=${encodeURIComponent(userData.email)}`)
      } else {
        router.push("/")
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Registration failed")
      }

      const userData = await response.json()
      
      toast({
        title: "Registration successful",
        description: "Please check your email for verification code",
      })

      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const verifyEmail = async (email: string, otp: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Verification failed")
      }

      // Update user data if logged in
      const token = localStorage.getItem("token")
      if (token) {
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          localStorage.setItem("user", JSON.stringify(userData))
          setUser(userData)
        }
      }

      toast({
        title: "Email verified",
        description: "Your email has been verified successfully",
      })

      router.push("/login")
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "An error occurred during verification",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerification = async (email: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Failed to resend verification code")
      }

      toast({
        title: "Verification code sent",
        description: "Please check your email for the new verification code",
      })
    } catch (error) {
      toast({
        title: "Failed to resend code",
        description: error instanceof Error ? error.message : "An error occurred while resending the code",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/")

    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    verifyEmail,
    resendVerification,
  }

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
