import type { User, Album, ImageType } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Client-side fetch function
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token")
  if (!token) {
    throw new Error("No authentication token found")
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getAllPeople(): Promise<User[]> {
  const response = await fetchWithAuth("/people")
  return response.map((person: any) => ({
    id: person._id,
    name: person.name,
    avatarUrl: person.avatar_url || "/placeholder.svg?height=300&width=300",
    imageCount: person.image_count,
  }))
}

export async function getPersonById(id: string): Promise<User | null> {
  try {
    const response = await fetchWithAuth(`/people/${id}`)
    return {
      id: response._id,
      name: response.name,
      avatarUrl: response.avatar_url || "/placeholder.svg?height=300&width=300",
      imageCount: response.image_count,
    }
  } catch (error) {
    console.error("Error fetching person:", error)
    return null
  }
}

export async function updatePerson(person: User): Promise<User> {
  const response = await fetchWithAuth(`/people/${person.id}`, {
    method: "PUT",
    body: JSON.stringify({ name: person.name }),
  })
  return {
    id: response._id,
    name: response.name,
    avatarUrl: response.avatar_url || "/placeholder.svg?height=300&width=300",
    imageCount: response.image_count,
  }
}

export async function mergePeople(personIds: string[]): Promise<void> {
  await fetchWithAuth("/people/merge", {
    method: "POST",
    body: JSON.stringify({ person_ids: personIds }),
  })
}

export async function getAllAlbums(): Promise<Album[]> {
  const response = await fetchWithAuth("/albums")
  return response.map((album: any) => ({
    id: album._id,
    name: album.name,
    description: album.description,
    coverImage: album.cover_image,
    imageCount: album.image_count,
    createdAt: new Date(album.created_at),
  }))
}

export async function getAlbumById(id: string): Promise<Album | null> {
  try {
    const response = await fetchWithAuth(`/albums/${id}`)
    return {
      id: response._id,
      name: response.name,
      description: response.description,
      coverImage: response.cover_image,
      imageCount: response.image_count,
      createdAt: new Date(response.created_at),
    }
  } catch (error) {
    console.error("Error fetching album:", error)
    return null
  }
}

export async function getAllImages(): Promise<ImageType[]> {
  const response = await fetchWithAuth("/images")
  return response.map((image: any) => ({
    id: image._id,
    url: `${API_BASE_URL}/images/${image._id}/content`,
    pathname: image.pathname,
    caption: image.caption,
    createdAt: new Date(image.created_at),
    albumIds: image.album_ids,
    peopleIds: image.people_ids,
    width: image.width,
    height: image.height,
    fileSize: image.size,
    fileType: image.content_type,
  }))
}

export async function getImagesByPersonId(personId: string): Promise<ImageType[]> {
  const response = await fetchWithAuth(`/people/${personId}/images`)
  return response.map((image: any) => ({
    id: image._id,
    url: `${API_BASE_URL}/images/${image._id}/content`,
    pathname: image.pathname,
    caption: image.caption,
    createdAt: new Date(image.created_at),
    albumIds: image.album_ids,
    peopleIds: image.people_ids,
    width: image.width,
    height: image.height,
    fileSize: image.size,
    fileType: image.content_type,
  }))
}

export async function getImagesByAlbumId(albumId: string): Promise<ImageType[]> {
  const response = await fetchWithAuth(`/albums/${albumId}/images`)
  return response.map((image: any) => ({
    id: image._id,
    url: `${API_BASE_URL}/images/${image._id}/content`,
    pathname: image.pathname,
    caption: image.caption,
    createdAt: new Date(image.created_at),
    albumIds: image.album_ids,
    peopleIds: image.people_ids,
    width: image.width,
    height: image.height,
    fileSize: image.size,
    fileType: image.content_type,
  }))
}

export async function addImagesToAlbum(imageIds: string[], albumId: string): Promise<void> {
  await fetchWithAuth(`/albums/${albumId}/images`, {
    method: "POST",
    body: JSON.stringify(imageIds),
  })
}

export async function uploadImage(file: File, caption?: string, detectFaces: boolean = false): Promise<ImageType> {
  const formData = new FormData()
  formData.append("file", file)
  if (caption) {
    formData.append("caption", caption)
  }
  formData.append("detect_faces", detectFaces.toString())

  const response = await fetchWithAuth("/images", {
    method: "POST",
    body: formData,
  })

  // Fetch person information for each person ID
  const peoplePromises = response.people_ids.map((personId: string) => getPersonById(personId))
  const people = await Promise.all(peoplePromises)
  
  return {
    id: response._id,
    url: `${API_BASE_URL}/images/${response._id}/content`,
    pathname: response.pathname,
    caption: response.caption,
    createdAt: new Date(response.created_at),
    albumIds: response.album_ids,
    peopleIds: response.people_ids,
    people: people.filter((p): p is User => p !== null),
    width: response.width,
    height: response.height,
    fileSize: response.size,
    fileType: response.content_type,
  }
}

export async function detectFacesInImage(imageId: string): Promise<void> {
  await fetchWithAuth(`/images/${imageId}/detect-faces`, {
    method: "POST",
  })
}

export async function deleteImage(imageId: string): Promise<void> {
  await fetchWithAuth(`/images/${imageId}`, {
    method: "DELETE",
  })
}

export async function updatePersonName(personId: string, name: string): Promise<void> {
  await fetchWithAuth(`/people/${personId}/name`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  })
}

export async function createAlbum(name: string, description?: string): Promise<Album> {
  const response = await fetchWithAuth("/albums", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  })
  
  return {
    id: response._id,
    name: response.name,
    description: response.description,
    coverImage: response.cover_image,
    imageCount: response.image_count,
    createdAt: new Date(response.created_at),
  }
}

export async function deleteAlbum(albumId: string): Promise<void> {
  await fetchWithAuth(`/albums/${albumId}`, {
    method: "DELETE",
  })
}

export async function updateAlbumName(albumId: string, name: string): Promise<Album> {
  const response = await fetchWithAuth(`/albums/${albumId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  })
  
  return {
    id: response._id,
    name: response.name,
    description: response.description,
    coverImage: response.cover_image,
    imageCount: response.image_count,
    createdAt: new Date(response.created_at),
  }
}
