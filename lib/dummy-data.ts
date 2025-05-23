import type { User, Album, ImageType } from "./types"

export function getDummyPeople(): User[] {
  return [
    {
      id: "dummy-1",
      name: "John Doe",
      avatarUrl: "/placeholder.svg?height=300&width=300&text=John",
      imageCount: 24,
    },
    {
      id: "dummy-2",
      name: "Jane Smith",
      avatarUrl: "/placeholder.svg?height=300&width=300&text=Jane",
      imageCount: 18,
    },
    {
      id: "dummy-3",
      name: "Alex Johnson",
      avatarUrl: "/placeholder.svg?height=300&width=300&text=Alex",
      imageCount: 32,
    },
    {
      id: "dummy-4",
      name: "Sarah Williams",
      avatarUrl: "/placeholder.svg?height=300&width=300&text=Sarah",
      imageCount: 15,
    },
    {
      id: "dummy-5",
      name: "Michael Brown",
      avatarUrl: "/placeholder.svg?height=300&width=300&text=Michael",
      imageCount: 27,
    },
    {
      id: "dummy-6",
      name: "Emily Davis",
      avatarUrl: "/placeholder.svg?height=300&width=300&text=Emily",
      imageCount: 21,
    },
  ]
}

export function getDummyAlbums(): Album[] {
  return [
    {
      id: "dummy-album-1",
      name: "Vacation 2023",
      coverUrl: "/placeholder.svg?height=400&width=600&text=Vacation",
      imageCount: 42,
      createdAt: new Date("2023-08-15"),
      description: "Summer vacation photos",
    },
    {
      id: "dummy-album-2",
      name: "Family Gathering",
      coverUrl: "/placeholder.svg?height=400&width=600&text=Family",
      imageCount: 28,
      createdAt: new Date("2023-12-25"),
      description: "Christmas family photos",
    },
    {
      id: "dummy-album-3",
      name: "Birthday Party",
      coverUrl: "/placeholder.svg?height=400&width=600&text=Birthday",
      imageCount: 16,
      createdAt: new Date("2024-02-10"),
      description: "Birthday celebration",
    },
    {
      id: "dummy-album-4",
      name: "Graduation",
      coverUrl: "/placeholder.svg?height=400&width=600&text=Graduation",
      imageCount: 22,
      createdAt: new Date("2023-06-20"),
      description: "Graduation ceremony",
    },
    {
      id: "dummy-album-5",
      name: "Wedding",
      coverUrl: "/placeholder.svg?height=400&width=600&text=Wedding",
      imageCount: 35,
      createdAt: new Date("2023-09-05"),
      description: "Wedding photos",
    },
  ]
}

export function getDummyImages(): ImageType[] {
  return Array.from({ length: 20 }).map((_, i) => ({
    id: `dummy-img-${i + 1}`,
    url: `/placeholder.svg?height=800&width=800&text=Sample Image ${i + 1}`,
    pathname: `images/dummy-img-${i + 1}.jpg`,
    caption: i % 3 === 0 ? `Sample image caption ${i + 1}` : undefined,
    createdAt: new Date(Date.now() - i * 86400000),
    albumIds: i % 4 === 0 ? ["dummy-album-1"] : i % 4 === 1 ? ["dummy-album-2"] : [],
    peopleIds: i % 5 === 0 ? ["dummy-1"] : i % 5 === 1 ? ["dummy-2"] : i % 5 === 2 ? ["dummy-3"] : [],
    width: 800,
    height: 800,
    fileSize: 1024 * 1024 * (1 + Math.random()),
    fileType: "image/jpeg",
  }))
}
