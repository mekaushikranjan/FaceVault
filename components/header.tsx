"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Camera, Users, FolderOpen, Upload, Menu, Settings, LogOut, Moon, Sun, X, Home } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AuthModal } from "@/components/auth-modal"

export default function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [mounted, setMounted] = useState(false)

  // Handle mounting state and initial theme
  useEffect(() => {
    setMounted(true)
    // Set initial theme to system if not already set
    if (!localStorage.getItem('theme')) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme(systemTheme)
    }
  }, [setTheme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [setTheme])

  // Close sidebar when clicking outside on mobile
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (isSidebarOpen && target.id === "sidebar-overlay") {
      setIsSidebarOpen(false)
    }
  }, [isSidebarOpen])

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick)
    return () => document.removeEventListener("click", handleOutsideClick)
  }, [handleOutsideClick])

  // Close sidebar when route changes
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [pathname])

  // Prevent body scrolling when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('sidebar-open')
    } else {
      document.body.classList.remove('sidebar-open')
    }
    return () => {
      document.body.classList.remove('sidebar-open')
    }
  }, [isSidebarOpen])

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  const navItems = [
    { name: "Gallery", href: "/", icon: Camera, requiresAuth: false },
    { name: "People", href: "/people", icon: Users, requiresAuth: false },
    { name: "Albums", href: "/albums", icon: FolderOpen, requiresAuth: false },
    { name: "Upload", href: "/upload", icon: Upload, requiresAuth: true },
  ]

  // Filter nav items based on authentication status
  const filteredNavItems = navItems.filter((item) => !item.requiresAuth || isAuthenticated)

  const handleLoginClick = () => {
    setActiveTab("login")
    setShowAuthModal(true)
  }

  const handleRegisterClick = () => {
    setActiveTab("register")
    setShowAuthModal(true)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // Render theme toggle button only after mounting
  const renderThemeToggle = () => {
    if (!mounted) return null;

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="text-foreground hover:text-accent-foreground"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <>
      <header className="bg-background border-border border-b sticky top-0 z-[40]">
        <div className="container mx-auto px-4 py-4 sm:py-6 max-w-[1920px]">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 sm:h-9 sm:w-9 text-primary" />
              <span className="text-2xl sm:text-3xl font-bold">
                <span className="text-primary">Face</span>
                <span className="text-foreground">Vault</span>
                
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href
                const ItemIcon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 lg:px-4 lg:py-2 rounded-md flex items-center space-x-2 transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <ItemIcon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}

              {/* Theme Toggle */}
              {renderThemeToggle()}

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.profile_image || ""} alt={user?.username || "User"} />
                        <AvatarFallback className="text-primary-foreground bg-primary">
                          {user?.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 bg-background border-border"
                    align="end"
                  >
                    <DropdownMenuLabel className="text-foreground">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="cursor-pointer w-full flex items-center text-foreground"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={handleLoginClick} className="text-foreground">
                    Login
                  </Button>
                  <Button onClick={handleRegisterClick} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Sign Up
                  </Button>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              {/* Theme Toggle */}
              {renderThemeToggle()}

              {/* Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-foreground hover:text-accent-foreground"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Container */}
      <div className="relative">
        {/* Overlay */}
        <div
          id="sidebar-overlay"
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] md:hidden transition-opacity duration-300",
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        />

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-0 right-0 z-[60] h-full w-72 bg-background border-l border-border shadow-xl transition-transform duration-300 ease-in-out",
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          )}
          aria-hidden={!isSidebarOpen}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="h-8 w-8 text-primary" />
                  <span className="font-bold text-2xl">
                    <span className="text-primary">Face</span>
                    <span className="text-foreground">Vault</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                  <span className="sr-only">Close sidebar</span>
                </Button>
              </div>
            </div>

            {/* User Profile */}
            <div className="p-6 border-b border-border">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.profile_image || ""} alt={user?.username || "User"} />
                    <AvatarFallback className="text-primary-foreground bg-primary">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Welcome,</p>
                    <p className="text-lg font-bold text-foreground">{user?.username}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">Not signed in</p>
                  <div className="flex gap-3">
                    <Button asChild variant="outline" size="lg" className="flex-1">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild size="lg" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Link href="/login">Sign Up</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-6">
              <ul className="space-y-3">
                {filteredNavItems.map((item) => {
                  const isActive = pathname === item.href
                  const ItemIcon = item.icon

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                        onClick={toggleSidebar}
                      >
                        <ItemIcon className="h-6 w-6" />
                        <span className="text-lg">{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-border space-y-4">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-10 w-10"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>

              {/* Settings and Logout */}
              {isAuthenticated && (
                <div className="space-y-2">
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full justify-start"
                  >
                    <Link href="/settings" className="flex items-center gap-3">
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={logout}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>Log out</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultTab={activeTab} />
    </>
  )
}
