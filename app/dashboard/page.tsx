"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Complaint {
  id: string
  title: string
  status: string
  category: string
  severity: string
  created_at: string
  updated_at: string
  state: string
  district: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "resolved">("all")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Check authentication
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push("/auth/login")
        return
      }

      setUser(currentUser)

      // Fetch user complaints
      let query = supabase.from("complaints").select("*").eq("user_id", currentUser.id).order("created_at", {
        ascending: false,
      })

      if (filter !== "all") {
        query = query.eq("status", filter)
      }

      const { data: complaintsData, error } = await query

      if (error) {
        console.error("Error fetching complaints:", error)
      } else {
        setComplaints(complaintsData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router, filter])

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "water":
        return "💧"
      case "electricity":
        return "⚡"
      case "garbage":
        return "🗑️"
      case "roads":
        return "🛣️"
      case "sewage":
        return "🌊"
      case "streetlight":
        return "🔦"
      default:
        return "📝"
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Issues</h1>
            <p className="text-gray-600 mt-2">Track and manage your civic complaints</p>
          </div>
          <div className="flex gap-4">
            <Link href="/complaints/new">
              <Button className="bg-blue-600 hover:bg-blue-700">Report New Issue</Button>
            </Link>
            <Button variant="outline" onClick={() => router.push("/")}>
              Logout
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {["all", "pending", "in-progress", "resolved"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status as any)}
              className={filter === status ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
            </Button>
          ))}
        </div>

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">No issues found</p>
              <Link href="/complaints/new">
                <Button className="bg-blue-600 hover:bg-blue-700">Report Your First Issue</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="text-3xl">{getCategoryIcon(complaint.category)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                          <p className="text-sm text-gray-500">
                            {complaint.state}, {complaint.district}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}
                        >
                          {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace("-", " ")}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 mb-4">
                        <span>Category: {complaint.category}</span>
                        <span>Severity: {complaint.severity}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(complaint.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Link href={`/complaints/${complaint.id}`} className="mt-4 block">
                    <Button variant="outline" className="w-full bg-transparent">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
