import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { redirect } from "next/navigation"

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
}

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: complaintId } = await params

  if (!isValidUUID(complaintId)) {
    redirect("/complaints/new")
  }

  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect("/auth/login")
  }

  // Fetch complaint
  const { data: complaint, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("id", complaintId)
    .eq("user_id", currentUser.id)
    .single()

  if (error || !complaint) {
    redirect("/dashboard")
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
        <Link href="/dashboard" className="mb-6 inline-block">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{complaint.title}</CardTitle>
                <CardDescription>ID: {complaint.id}</CardDescription>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace("-", " ")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location Section */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Location</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">State</p>
                  <p className="font-medium">{complaint.state}</p>
                </div>
                <div>
                  <p className="text-gray-600">District</p>
                  <p className="font-medium">{complaint.district}</p>
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
              <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
            </div>

            {/* Categorization */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold text-lg capitalize">{complaint.category}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded">
                <p className="text-sm text-gray-600">Severity</p>
                <p className="font-semibold text-lg capitalize">{complaint.severity}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">Keywords</p>
                <div className="flex gap-1 flex-wrap mt-2">
                  {complaint.keywords &&
                    complaint.keywords.slice(0, 2).map((kw, idx) => (
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
            {complaint.resolution_notes && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Resolution Notes</h3>
                <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <p className="text-gray-700">{complaint.resolution_notes}</p>
                </div>
              </div>
            )}

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
