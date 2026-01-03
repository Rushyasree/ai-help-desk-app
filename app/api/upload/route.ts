import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${ext}`
    const filePath = `complaints/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("complaints").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("complaints").getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl, path: filePath })
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
