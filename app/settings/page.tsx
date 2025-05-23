"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, User, Shield, Bell, Palette, Database, Lock, Globe, Mail, Key, Image, Album } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { formatBytes } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubscriptionSuccess } from "@/components/subscription-success"
import { addMonths } from "date-fns"
import { SubscriptionConfirmationEmail } from "@/components/email-templates/subscription-confirmation"

const plans = {
  pro: {
    storage: "100GB",
    price: {
      "6months": 9.99,
      "12months": 15.99
    }
  },
  enterprise: {
    storage: "1TB",
    price: {
      "6months": 24.99,
      "12months": 30.99
    }
  },
}

export default function SettingsPage() {
  const { user, isLoading, updateUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    bio: user?.bio || ""
  })
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
    otp: ""
  })
  const [storageStats, setStorageStats] = useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [storageSettings, setStorageSettings] = useState({
    auto_compression: true,
    keep_original: false
  })
  const [isClearing, setIsClearing] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    photo_alerts: true,
    face_detection_updates: true,
    new_album_notifications: true,
    storage_alerts: true
  })
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [appearanceSettings, setAppearanceSettings] = useState({
    dark_mode: false,
    compact_view: false,
    grid_density: "medium"
  })
  const [isUpdatingAppearance, setIsUpdatingAppearance] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null)
  const [subscriptionDates, setSubscriptionDates] = useState({
    startDate: new Date(),
    endDate: new Date()
  })

  const handleProfileUpdate = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const data = await response.json()
      updateUser(data.user)
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePasswordUpdate = async () => {
    try {
      // Validate passwords
      if (passwordData.new_password !== passwordData.confirm_password) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        })
        return
      }

      setIsUpdating(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/password/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
          otp: showOtpInput ? passwordData.otp : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update password")
      }

      if (data.message === "OTP sent successfully") {
        setShowOtpInput(true)
        toast({
          title: "Success",
          description: "OTP sent to your email",
        })
      } else {
        // Password updated successfully
        setShowOtpInput(false)
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
          otp: ""
        })
        toast({
          title: "Success",
          description: "Password updated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      setIsSendingOtp(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/password/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to resend OTP")
      }

      toast({
        title: "Success",
        description: "OTP resent successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP",
        variant: "destructive",
      })
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Fetch storage stats
  const fetchStorageStats = async () => {
    try {
      setIsLoadingStats(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view storage statistics",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/storage/stats`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        // Handle unauthorized error
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        })
        // Optionally redirect to login
        router.push("/login")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch storage stats")
      }

      const data = await response.json()
      setStorageStats(data)
      setStorageSettings(data.settings)
    } catch (error) {
      console.error("Storage stats error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch storage statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Update storage settings
  const handleStorageSettingsUpdate = async () => {
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to update storage settings",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/storage/settings`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(storageSettings),
      })

      if (response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to update storage settings")
      }
      
      toast({
        title: "Success",
        description: "Storage settings updated successfully",
      })
    } catch (error) {
      console.error("Storage settings error:", error)
      toast({
        title: "Error",
        description: "Failed to update storage settings",
        variant: "destructive",
      })
    }
  }

  // Clear storage
  const handleClearStorage = async (type: "all" | "faces" | "cache") => {
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to clear storage",
          variant: "destructive",
        })
        return
      }

      setIsClearing(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/storage/clear`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clear_type: type }),
      })

      if (response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to clear storage")
      }
      
      toast({
        title: "Success",
        description: `Storage cleared successfully: ${type}`,
      })
      
      // Refresh storage stats
      await fetchStorageStats()
    } catch (error) {
      console.error("Clear storage error:", error)
      toast({
        title: "Error",
        description: "Failed to clear storage",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  // Fetch storage stats on mount
  useEffect(() => {
    fetchStorageStats()
  }, [])

  // Fetch notification settings
  const fetchNotificationSettings = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/notifications/settings`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (!response.ok) throw new Error("Failed to fetch notification settings")

      const data = await response.json()
      setNotificationSettings(data)
    } catch (error) {
      console.error("Notification settings error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch notification settings",
        variant: "destructive",
      })
    }
  }

  // Update notification settings
  const handleNotificationSettingsUpdate = async () => {
    try {
      setIsUpdatingNotifications(true)
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/notifications/settings`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationSettings),
      })

      if (response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (!response.ok) throw new Error("Failed to update notification settings")

      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      })
    } catch (error) {
      console.error("Update notification settings error:", error)
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingNotifications(false)
    }
  }

  // Send test notification
  const handleTestNotification = async (type: string) => {
    try {
      setIsSendingTest(true)
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/notifications/test`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notification_type: type }),
      })

      if (response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (!response.ok) throw new Error("Failed to send test notification")

      toast({
        title: "Success",
        description: "Test notification sent successfully",
      })
    } catch (error) {
      console.error("Test notification error:", error)
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  // Fetch notification settings on mount
  useEffect(() => {
    fetchNotificationSettings()
  }, [])

  // Fetch appearance settings
  const fetchAppearanceSettings = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/appearance/settings`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (!response.ok) throw new Error("Failed to fetch appearance settings")

      const data = await response.json()
      setAppearanceSettings(data)
    } catch (error) {
      console.error("Appearance settings error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch appearance settings",
        variant: "destructive",
      })
    }
  }

  // Update appearance settings
  const handleAppearanceSettingsUpdate = async () => {
    try {
      setIsUpdatingAppearance(true)
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/appearance/settings`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appearanceSettings),
      })

      if (response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (!response.ok) throw new Error("Failed to update appearance settings")

      toast({
        title: "Success",
        description: "Appearance settings updated successfully",
      })
    } catch (error) {
      console.error("Update appearance settings error:", error)
      toast({
        title: "Error",
        description: "Failed to update appearance settings",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingAppearance(false)
    }
  }

  // Fetch appearance settings on mount
  useEffect(() => {
    fetchAppearanceSettings()
  }, [])

  useEffect(() => {
    const success = searchParams.get("success")
    if (success === "true") {
      const plan = localStorage.getItem("userPlan") || "pro"
      const duration = localStorage.getItem("subscriptionDuration") || "6months"
      
      // Calculate subscription dates
      const startDate = new Date()
      const endDate = addMonths(startDate, duration === "6months" ? 6 : 12)
      
      setSubscriptionDates({ startDate, endDate })
      setSubscriptionPlan(plan)
      setShowSuccess(true)

      // Send confirmation email
      const emailContent = SubscriptionConfirmationEmail({
        userName: user?.full_name || user?.username || "User",
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        storage: plans[plan as keyof typeof plans].storage,
        startDate,
        endDate,
        duration: duration as "6months" | "12months"
      })

      // Send email using your email service
      fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: user?.email,
          subject: `Welcome to ${plan} Plan!`,
          html: emailContent
        })
      }).catch(console.error)
    }
  }, [searchParams, user])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 sm:mb-8 bg-background p-4 rounded-lg border border-border">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.profile_image} />
          <AvatarFallback className="text-lg">{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-2">
        <TabsList className="grid grid-cols-6 sm:grid-cols-6 h-15 gap-2 bg-muted/50 rounded-lg mb-8">
          <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5">
            <User className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5">
            <Key className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm">Account</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5">
            <Shield className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5">
            <Bell className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5">
            <Palette className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-1.5">
            <Database className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm">Storage</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information and how others see you on the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={user?.username} disabled />
                <p className="text-sm text-muted-foreground">Username cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email} disabled />
                <p className="text-sm text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input 
                  id="full_name" 
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us about yourself"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
              <Button 
                className="w-full sm:w-auto" 
                onClick={handleProfileUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account security and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input 
                  id="current-password" 
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                />
              </div>
              {showOtpInput && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="otp" 
                      placeholder="Enter OTP"
                      value={passwordData.otp}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, otp: e.target.value }))}
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleResendOtp}
                      disabled={isSendingOtp}
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Resend"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Enter the verification code sent to your email</p>
                </div>
              )}
              <Button 
                className="w-full sm:w-auto" 
                onClick={handlePasswordUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  showOtpInput ? "Verify & Update Password" : "Update Password"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your privacy and data sharing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Photo Sharing</Label>
                  <p className="text-sm text-muted-foreground">Allow others to share your photos</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Face Recognition</Label>
                  <p className="text-sm text-muted-foreground">Enable AI face detection</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <Label>Email Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.email_notifications}
                    onCheckedChange={(checked) => {
                      setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))
                      handleNotificationSettingsUpdate()
                    }}
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <Label>Photo Alerts</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Get notified when new photos are added</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.photo_alerts}
                    onCheckedChange={(checked) => {
                      setNotificationSettings(prev => ({ ...prev, photo_alerts: checked }))
                      handleNotificationSettingsUpdate()
                    }}
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <Label>Face Detection Updates</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Notifications about face detection results</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.face_detection_updates}
                    onCheckedChange={(checked) => {
                      setNotificationSettings(prev => ({ ...prev, face_detection_updates: checked }))
                      handleNotificationSettingsUpdate()
                    }}
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Album className="h-4 w-4" />
                      <Label>Album Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Get notified about new albums and updates</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.new_album_notifications}
                    onCheckedChange={(checked) => {
                      setNotificationSettings(prev => ({ ...prev, new_album_notifications: checked }))
                      handleNotificationSettingsUpdate()
                    }}
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <Label>Storage Alerts</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Get notified about storage usage and limits</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.storage_alerts}
                    onCheckedChange={(checked) => {
                      setNotificationSettings(prev => ({ ...prev, storage_alerts: checked }))
                      handleNotificationSettingsUpdate()
                    }}
                    disabled={isUpdatingNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize how FaceVault looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <Switch 
                  checked={appearanceSettings.dark_mode}
                  onCheckedChange={(checked) => {
                    setAppearanceSettings(prev => ({ ...prev, dark_mode: checked }))
                    handleAppearanceSettingsUpdate()
                  }}
                  disabled={isUpdatingAppearance}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">Show more content in less space</p>
                </div>
                <Switch 
                  checked={appearanceSettings.compact_view}
                  onCheckedChange={(checked) => {
                    setAppearanceSettings(prev => ({ ...prev, compact_view: checked }))
                    handleAppearanceSettingsUpdate()
                  }}
                  disabled={isUpdatingAppearance}
                />
              </div>
              <div className="space-y-2">
                <Label>Grid Density</Label>
                <p className="text-sm text-muted-foreground">Adjust photo grid spacing</p>
                <Select
                  value={appearanceSettings.grid_density}
                  onValueChange={(value) => {
                    setAppearanceSettings(prev => ({ ...prev, grid_density: value }))
                    handleAppearanceSettingsUpdate()
                  }}
                  disabled={isUpdatingAppearance}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select density" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Management</CardTitle>
              <CardDescription>Manage your storage space and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingStats ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : storageStats && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Storage Usage</Label>
                      <span className="text-sm text-muted-foreground">
                        {formatBytes(storageStats.total_storage)} of {formatBytes(storageStats.storage_limit)}
                      </span>
                    </div>
                    <Progress 
                      value={(storageStats.total_storage / storageStats.storage_limit) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-medium">Images</h4>
                      <p className="text-2xl font-bold">{storageStats.image_count}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(storageStats.storage_by_type.images)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-medium">Albums</h4>
                      <p className="text-2xl font-bold">{storageStats.album_count}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-medium">People</h4>
                      <p className="text-2xl font-bold">{storageStats.people_count}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(storageStats.storage_by_type.faces)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Compression</Label>
                        <p className="text-sm text-muted-foreground">Automatically compress large photos</p>
                      </div>
                      <Switch
                        checked={storageSettings.auto_compression}
                        onCheckedChange={(checked) => {
                          setStorageSettings(prev => ({ ...prev, auto_compression: checked }))
                          handleStorageSettingsUpdate()
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Keep Original Quality</Label>
                        <p className="text-sm text-muted-foreground">Store original photo quality</p>
                      </div>
                      <Switch
                        checked={storageSettings.keep_original}
                        onCheckedChange={(checked) => {
                          setStorageSettings(prev => ({ ...prev, keep_original: checked }))
                          handleStorageSettingsUpdate()
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Clear Storage</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full" disabled={isClearing}>
                            Clear Cache
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear Cache</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will clear all temporary files and cache. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleClearStorage("cache")}>
                              Clear Cache
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full" disabled={isClearing}>
                            Clear Face Data
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear Face Data</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove all face detection data. You'll need to re-detect faces in your photos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleClearStorage("faces")}>
                              Clear Face Data
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full" disabled={isClearing}>
                            Clear All Data
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all your photos, albums, and people data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleClearStorage("all")}>
                              Clear All Data
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage Subscription</CardTitle>
              <CardDescription>Upgrade your storage plan for more space and features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
                  <p className="text-2xl font-bold mb-2">
                    {!storageStats?.plan || storageStats.plan === "free" ? "Free" : 
                     storageStats.plan === "pro" ? "Pro" : "Enterprise"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {!storageStats?.plan || storageStats.plan === "free" ? "10GB Storage" :
                     storageStats.plan === "pro" ? "100GB Storage" : "1TB Storage"}
                  </p>
                  {!storageStats?.plan || storageStats.plan === "free" ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      Unlimited validity
                    </p>
                  ) : storageStats?.end_date ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      Valid until: {new Date(storageStats.end_date).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Get more storage space and advanced features with our premium plans
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/subscription")}
                  >
                    View Plans
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showSuccess && subscriptionPlan && (
        <SubscriptionSuccess
          plan={subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)}
          storage={plans[subscriptionPlan as keyof typeof plans].storage}
          duration={localStorage.getItem("subscriptionDuration") as "6months" | "12months" || "6months"}
          startDate={subscriptionDates.startDate}
          endDate={subscriptionDates.endDate}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  )
} 