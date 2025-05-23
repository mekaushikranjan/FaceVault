export interface User {
  id: string
  name: string
  avatarUrl?: string
  imageCount: number
  email?: string
  username?: string
}

export interface Album {
  id: string
  name: string
  description?: string
  coverImage?: string
  imageCount: number
  createdAt: Date
}

export interface ImageType {
  id: string
  url: string
  pathname: string
  caption?: string
  createdAt: Date
  albumIds: string[]
  peopleIds: string[]
  people?: User[]
  width?: number
  height?: number
  fileSize?: number
  fileType?: string
  faceDetections?: FaceDetection[]
}

export interface FaceDetection {
  id: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
  personId?: string
}
