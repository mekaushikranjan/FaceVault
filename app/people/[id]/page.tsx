"use client"

import { useState, useEffect } from "react"
import { getPersonById, getImagesByPersonId, updatePerson } from "@/lib/data"
import ImageGrid from "@/components/image-grid"
import EditPersonDialog from "@/components/edit-person-dialog"
import { Button } from "@/components/ui/button"
import { Pencil, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { User, ImageType } from "@/lib/types"

export default function PersonPage({ params }: { params: { id: string } }) {
  const [person, setPerson] = useState<User | null>(null)
  const [images, setImages] = useState<ImageType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const router = useRouter()

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const personData = await getPersonById(params.id)
        if (!personData) {
          router.push("/404")
          return
        }

        setPerson(personData)
        const imagesData = await getImagesByPersonId(params.id)
        setImages(imagesData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const handleUpdatePerson = async (updatedPerson: User) => {
    await updatePerson(updatedPerson)
    setPerson(updatedPerson)
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }

  if (!person) {
    return null
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white">{person.name}</h1>
            <p className="text-gray-300 mt-2">{images.length} photos</p>
          </div>
          <Button onClick={() => setIsEditDialogOpen(true)} variant="outline" className="border-gray-700 text-white">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <ImageGrid images={images} />
      </section>

      <EditPersonDialog
        person={person}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdatePerson}
      />
    </div>
  )
}
