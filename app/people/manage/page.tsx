"use client"

import { useState, useEffect } from "react"
import { getAllPeople, updatePerson, mergePeople } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Save, ArrowLeft, UsersRound } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { User } from "@/lib/types"

export default function ManagePeoplePage() {
  const [people, setPeople] = useState<User[]>([])
  const [editedNames, setEditedNames] = useState<Record<string, string>>({})
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const peopleData = await getAllPeople()
        setPeople(peopleData)

        // Initialize edited names with current names
        const names: Record<string, string> = {}
        peopleData.forEach((person) => {
          names[person.id] = person.name
        })
        setEditedNames(names)
      } catch (error) {
        console.error("Error fetching people:", error)
        toast({
          title: "Error",
          description: "Failed to load people data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPeople()
  }, [toast])

  const handleNameChange = (id: string, name: string) => {
    setEditedNames((prev) => ({
      ...prev,
      [id]: name,
    }))
  }

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedPeople)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedPeople(newSelected)
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      // Save name changes
      const updatePromises = Object.entries(editedNames).map(async ([id, name]) => {
        const person = people.find((p) => p.id === id)
        if (person && person.name !== name) {
          await updatePerson({ ...person, name })
        }
      })

      await Promise.all(updatePromises)

      toast({
        title: "Changes saved",
        description: "All changes have been saved successfully",
      })

      router.refresh()
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleMergePeople = async () => {
    if (selectedPeople.size < 2) {
      toast({
        title: "Select at least two people",
        description: "You need to select at least two people to merge",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const peopleToMerge = Array.from(selectedPeople)
      await mergePeople(peopleToMerge)

      toast({
        title: "People merged",
        description: `Successfully merged ${selectedPeople.size} people`,
      })

      // Reset selection
      setSelectedPeople(new Set())
      router.refresh()
    } catch (error) {
      console.error("Error merging people:", error)
      toast({
        title: "Error",
        description: "Failed to merge people",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" className="border-gray-700">
              <Link href="/people">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-4xl font-bold text-white">Manage People</h1>
          </div>
          <div className="flex gap-2">
            {selectedPeople.size > 0 && (
              <Button
                onClick={handleMergePeople}
                disabled={isSaving || selectedPeople.size < 2}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UsersRound className="h-5 w-5 mr-2" />
                Merge Selected ({selectedPeople.size})
              </Button>
            )}
            <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white">
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {people.map((person) => (
            <Card key={person.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800">
                      {person.avatarUrl ? (
                        <Image
                          src={person.avatarUrl || "/placeholder.svg"}
                          alt={person.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl text-gray-400">{person.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-grow space-y-2">
                    <Input
                      value={editedNames[person.id] || ""}
                      onChange={(e) => handleNameChange(person.id, e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">{person.imageCount} photos</div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`select-${person.id}`}
                          checked={selectedPeople.has(person.id)}
                          onCheckedChange={() => handleToggleSelect(person.id)}
                        />
                        <label htmlFor={`select-${person.id}`} className="text-sm text-gray-300 cursor-pointer">
                          Select
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
