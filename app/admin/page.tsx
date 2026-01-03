"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  user_id: string
  profiles?: {
    full_name: string
    phone_number: string
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  })

  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    severity: "all",
    state: "all",
  })

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

      // Check admin status
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("is_admin")
        .eq("id", currentUser.id)
        .single()

      if (!adminUser?.is_admin) {
        router.push("/dashboard")
        return
      }

      setUser(currentUser)
      setIsAdmin(true)

      // Fetch complaints
      await fetchComplaints(supabase)
    }

    fetchData()
  }, [router])

  const fetchComplaints = async (supabase: any) => {
    let query = supabase.from("complaints").select("*, profiles(full_name, phone_number)").order("created_at", {
      ascending: false,
    })

    if (filters.status !== "all") {
      query = query.eq("status", filters.status)
    }
    if (filters.category !== "all") {
      query = query.eq("category", filters.category)
    }
    if (filters.severity !== "all") {
      query = query.eq("severity", filters.severity)
    }
    if (filters.state !== "all") {
      query = query.eq("state", filters.state)
    }

    const { data: complaintsData, error } = await query

    if (error) {
      console.error("Error fetching complaints:", error)
    } else {
      setComplaints(complaintsData || [])

      // Calculate stats
      const statsData = {
        total: complaintsData?.length || 0,
        pending: complaintsData?.filter((c) => c.status === "pending").length || 0,
        inProgress: complaintsData?.filter((c) => c.status === "in-progress").length || 0,
        resolved: complaintsData?.filter((c) => c.status === "resolved").length || 0,
      }
      setStats(statsData)
    }

    setLoading(false)
  }

  const updateComplaintStatus = async (complaintId: string, newStatus: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", complaintId)

    if (error) {
      console.error("Error updating complaint:", error)
    } else {
      // Refresh data
      await fetchComplaints(supabase)
    }
  }

  const addResolutionNote = async (complaintId: string, notes: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("complaints")
      .update({ resolution_notes: notes, updated_at: new Date().toISOString() })
      .eq("id", complaintId)

    if (error) {
      console.error("Error updating notes:", error)
    } else {
      await fetchComplaints(supabase)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAdmin) {
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "text-green-600"
      case "medium":
        return "text-yellow-600"
      case "high":
        return "text-orange-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and resolve civic complaints</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              createClient().auth.signOut()
              router.push("/")
            }}
          >
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Total Issues</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              <option value="all">All Categories</option>
              <option value="water">Water</option>
              <option value="electricity">Electricity</option>
              <option value="garbage">Garbage</option>
              <option value="roads">Roads</option>
              <option value="sewage">Sewage</option>
              <option value="streetlight">Streetlight</option>
            </select>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              <option value="all">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <Button
              onClick={() => {
                const supabase = createClient()
                fetchComplaints(supabase)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Complaints Table */}
        <Card>
          <CardContent className="pt-6">
            {complaints.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No complaints found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Title</th>
                      <th className="text-left py-3 px-4 font-semibold">Location</th>
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-left py-3 px-4 font-semibold">Severity</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((complaint) => (
                      <tr key={complaint.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <a href={`/admin/complaints/${complaint.id}`} className="text-blue-600 hover:underline">
                            {complaint.title}
                          </a>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {complaint.state}, {complaint.district}
                        </td>
                        <td className="py-3 px-4 text-sm capitalize">{complaint.category}</td>
                        <td className={`py-3 px-4 text-sm font-medium ${getSeverityColor(complaint.severity)}`}>
                          {complaint.severity}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={complaint.status}
                            onChange={(e) => updateComplaintStatus(complaint.id, e.target.value)}
                            className={`px-2 py-1 rounded text-sm font-medium border-0 ${getStatusColor(complaint.status)}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <a href={`/admin/complaints/${complaint.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
