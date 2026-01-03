import { categorizeComplaint } from "@/lib/categorizer"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No complaint text provided" }, { status: 400 })
    }

    const result = categorizeComplaint(text)

    return NextResponse.json({
      category: result.category,
      severity: result.severity,
      keywords: result.keywords,
    })
  } catch (error) {
    console.error("Categorization error:", error)
    return NextResponse.json({ error: "Categorization failed" }, { status: 500 })
  }
}
