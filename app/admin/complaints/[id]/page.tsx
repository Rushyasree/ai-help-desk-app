"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"

interface Complaint {
  id: string
  title: string
  description: string
  status: string
  category: string
  severity: string
  created_at: string
  updated_at: string
  state: string
  district: string
  town_village: string
  area_street: string
  image_url: string | null
  keywords: string[]
  resolution_notes: string | null
  profiles?: {
    full_name: string
    phone_number: string
  }
}

export default function AdminComplaintDetailPage() {
  const router = useRouter()
  const params = useParams()
  const complaintId = params.id as string
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Check auth and admin status
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: adminUser } = await supabase.from("admin_users").select("is_admin").eq("id", user.id).single()

      if (!adminUser?.is_admin) {
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)

      // Fetch complaint
      const { data: complaintData, error } = await supabase
        .from("complaints")
        .select("*, profiles(full_name, phone_number)")
        .eq("id", complaintId)
        .single()

      if (error) {
        console.error("Error fetching complaint:", error)
        router.push("/admin")
      } else {
        setComplaint(complaintData)
        setNotes(complaintData.resolution_notes || "")
      }

      setLoading(false)
    }

    fetchData()
  }, [complaintId, router])

  const handleSaveNotes = async () => {
    const supabase = createClient()
    setIsSaving(true)

    const { error } = await supabase
      .from("complaints")
      .update({
        resolution_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", complaintId)

    if (error) {
      console.error("Error saving notes:", error)
    } else {
      if (complaint) {
        setComplaint({ ...complaint, resolution_notes: notes })
      }
    }

    setIsSaving(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAdmin || !complaint) {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="mb-6 inline-block">
          <Button variant="outline">Back to Admin</Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{complaint.title}</CardTitle>
                <CardDescription>ID: {complaint.id}</CardDescription>
              </div>
              <select
                value={complaint.status}
                onChange={async (e) => {
                  const supabase = createClient()
                  await supabase.from("complaints").update({ status: e.target.value }).eq("id", complaint.id)
                  setComplaint({ ...complaint, status: e.target.value })
                }}
                className={`px-4 py-2 rounded text-sm font-medium border-0 ${getStatusColor(complaint.status)}`}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Reporter Info */}
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Reporter Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-medium">{complaint.profiles?.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium">{complaint.profiles?.phone_number || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Location</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">State/District</p>
                  <p className="font-medium">
                    {complaint.state}, {complaint.district}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Town/Village</p>
                  <p className="font-medium">{complaint.town_village}</p>
                </div>
                <div>
                  <p className="text-gray-600">Area/Street</p>
                  <p className="font-medium">{complaint.area_street}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded">{complaint.description}</p>
            </div>

            {/* AI Categorization */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold capitalize">{complaint.category}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded">
                <p className="text-sm text-gray-600">Severity</p>
                <p className="font-semibold capitalize">{complaint.severity}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">Keywords</p>
                <div className="flex gap-1 flex-wrap mt-2">
                  {complaint.keywords?.slice(0, 3).map((kw, idx) => (
                    <span key={idx} className="bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Image */}
            {complaint.image_url && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Attached Image</h3>
                <img
                  src={complaint.image_url || "/placeholder.svg"}
                  alt="Complaint evidence"
                  className="max-w-full h-auto rounded border"
                />
              </div>
            )}

            {/* Resolution Notes */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Resolution Notes</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add resolution notes..."
                rows={5}
                className="w-full"
              />
              <Button onClick={handleSaveNotes} disabled={isSaving} className="mt-2 bg-blue-600 hover:bg-blue-700">
                {isSaving ? "Saving..." : "Save Notes"}
              </Button>
            </div>

            {/* Timestamps */}
            <div className="text-sm text-gray-500 border-t pt-4">
              <p>Submitted: {new Date(complaint.created_at).toLocaleString()}</p>
              <p>Last Updated: {new Date(complaint.updated_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
