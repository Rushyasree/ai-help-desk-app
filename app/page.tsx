"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Smart Community Help Desk</h1>
          <p className="text-xl text-gray-600 mb-8">
            Report civic issues (water, electricity, garbage) quickly and track their resolution
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">Easy Reporting</h3>
            <p className="text-gray-600">Report issues via text, image, or voice</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-600">Smart categorization routes to right department</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold mb-2">Real-Time Tracking</h3>
            <p className="text-gray-600">Monitor issue status from submission to resolution</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/complaints/new">
                <Button size="lg" variant="outline">
                  Report New Issue
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Login
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="lg" variant="outline">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
