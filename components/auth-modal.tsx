"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Camera } from "lucide-react"
import Link from "next/link"
import { z } from "zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "login" | "register"
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const { login, register } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      // Validate form
      const result = loginSchema.safeParse(loginForm)
      if (!result.success) {
        const formattedErrors: Record<string, string> = {}
        result.error.errors.forEach((error) => {
          formattedErrors[error.path[0]] = error.message
        })
        setErrors(formattedErrors)
        setIsLoading(false)
        return
      }

      await login(loginForm.email, loginForm.password)
      onClose()
    } catch (error) {
      console.error("Login error:", error)
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("Invalid credentials")) {
          toast({
            title: "Login Failed",
            description: "Invalid email or password. Please check your credentials and try again.",
            variant: "destructive",
          })
        } else if (error.message.includes("User not found")) {
          toast({
            title: "Account Not Found",
            description: "No account found with this email address. Please check your email or register a new account.",
            variant: "destructive",
          })
        } else if (error.message.includes("Incorrect password")) {
          toast({
            title: "Incorrect Password",
            description: "The password you entered is incorrect. Please try again or use the forgot password option.",
            variant: "destructive",
          })
        } else if (error.message.includes("Email not verified")) {
          toast({
            title: "Email Not Verified",
            description: "Please verify your email address before logging in. Check your inbox for the verification link.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Login Error",
            description: "An error occurred during login. Please try again later.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      // Validate form
      const result = registerSchema.safeParse(registerForm)
      if (!result.success) {
        const formattedErrors: Record<string, string> = {}
        result.error.errors.forEach((error) => {
          formattedErrors[error.path[0]] = error.message
        })
        setErrors(formattedErrors)
        setIsLoading(false)
        return
      }

      await register(registerForm.username, registerForm.email, registerForm.password)
      onClose()
    } catch (error) {
      console.error("Registration error:", error)
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("Email already exists")) {
          toast({
            title: "Email Already Exists",
            description: "An account with this email already exists. Please try logging in instead.",
            variant: "destructive",
          })
        } else if (error.message.includes("Username already exists")) {
          toast({
            title: "Username Taken",
            description: "This username is already taken. Please choose a different one.",
            variant: "destructive",
          })
        } else if (error.message.includes("Invalid email format")) {
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address.",
            variant: "destructive",
          })
        } else if (error.message.includes("Password too weak")) {
          toast({
            title: "Weak Password",
            description: "Password is too weak. Please use a stronger password with at least 8 characters, including numbers and special characters.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Registration Error",
            description: "An error occurred during registration. Please try again later.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border p-4 pt-6 z-50">
        <DialogHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-muted p-3 rounded-full">
              <Camera className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold">
            <span className="text-primary">Face</span>
            <span className="text-foreground">Vault</span>
            
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage your photos with advanced face detection
          </DialogDescription>
        </DialogHeader>
        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "login" | "register")}
        >
          <TabsList className="grid grid-cols-2 w-full bg-muted">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <div className="pt-6">
            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="bg-background border-border"
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">
                      Password
                    </Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="bg-background border-border"
                    disabled={isLoading}
                  />
                  {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                </div>
                <div className="text-right mb-4">
                  <Link href="/reset-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    className="bg-background border-border"
                    disabled={isLoading}
                  />
                  {errors.username && <p className="text-destructive text-sm">{errors.username}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="bg-background border-border"
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-foreground">
                    Password
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="bg-background border-border"
                    disabled={isLoading}
                  />
                  {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="bg-background border-border"
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </div>
        </Tabs>
        <div className="text-center text-sm text-muted-foreground mt-4">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </div>
      </DialogContent>
    </Dialog>
  )
}
