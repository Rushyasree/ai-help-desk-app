"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"

export default function NewComplaintPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const [formData, setFormData] = useState({
    state: "",
    district: "",
    town_village: "",
    area_street: "",
    title: "",
    description: "",
    image: null as File | null,
    imageUrl: null as string | null,
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        console.log("[v0] Supabase client created, attempting getUser()")

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        console.log("[v0] Auth response - user:", user ? "exists" : "null", "error:", error?.message)

        if (error) {
          console.error("[v0] Auth error:", error)
          setError("Authentication service unavailable. Please refresh the page.")
          setLoading(false)
          return
        }

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error("[v0] Unexpected error in checkAuth:", err)
        setError("Failed to verify authentication. Please refresh the page.")
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }))
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onpause = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        // In production, you'd send this to Google Cloud Speech-to-Text API
        console.log("Audio recorded:", audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      setError("Microphone access denied")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Image upload failed")
    }

    const data = await response.json()
    return data.url
  }

  const categorizeComplaint = async (text: string, imageUrl?: string) => {
    const response = await fetch("/api/categorize-complaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
      }),
    })

    if (!response.ok) {
      throw new Error("Categorization failed")
    }

    return response.json()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      // Upload image if exists
      let imageUrl = null
      if (formData.image) {
        imageUrl = await uploadImage(formData.image)
      }

      // Categorize complaint
      const categorization = await categorizeComplaint(formData.description, imageUrl)

      // Get current user from Supabase
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) throw new Error("User not authenticated")

      // Insert complaint into database
      const { data: complaint, error: insertError } = await supabase
        .from("complaints")
        .insert({
          user_id: currentUser.id,
          state: formData.state,
          district: formData.district,
          town_village: formData.town_village,
          area_street: formData.area_street,
          title: formData.title,
          description: formData.description,
          image_url: imageUrl,
          category: categorization.category,
          severity: categorization.severity,
          keywords: categorization.keywords,
          status: "pending",
        })
        .select()

      if (insertError) throw insertError

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit complaint")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (error && error.includes("Authentication")) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/auth/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Report a Civic Issue</CardTitle>
            <CardDescription>Provide details about the problem you&apos;ve encountered</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Address Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="e.g., Maharashtra"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">District *</Label>
                    <Input
                      id="district"
                      name="district"
                      placeholder="e.g., Mumbai"
                      required
                      value={formData.district}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="town_village">Town / Village *</Label>
                    <Input
                      id="town_village"
                      name="town_village"
                      placeholder="e.g., Andheri"
                      required
                      value={formData.town_village}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="area_street">Area / Street *</Label>
                    <Input
                      id="area_street"
                      name="area_street"
                      placeholder="e.g., Main Street"
                      required
                      value={formData.area_street}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Complaint Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Complaint Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Issue Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Water leakage on Main Street"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe the issue in detail..."
                      required
                      rows={5}
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Evidence (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image">Upload Image</Label>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
                    />
                    {formData.image && (
                      <p className="text-sm text-green-600 mt-2">Image selected: {formData.image.name}</p>
                    )}
                  </div>

                  <div>
                    <Label>Voice Note (Optional)</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={isRecording ? "destructive" : "outline"}
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        {isRecording ? "Stop Recording" : "Start Recording"}
                      </Button>
                      <span className="text-sm text-gray-600 flex items-center">
                        {isRecording ? "Recording..." : "Optional"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {error && !error.includes("Authentication") && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
