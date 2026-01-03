// Categories: Water, Electricity, Garbage, Road, General
// No external API calls needed

interface CategoryResult {
  category: "water" | "electricity" | "garbage" | "road" | "general"
  severity: "low" | "medium" | "high" | "critical"
  keywords: string[]
  summary: string
}

const categoryKeywords = {
  water: {
    keywords: [
      "water leak",
      "leakage",
      "pipe burst",
      "broken pipe",
      "water supply",
      "shortage",
      "contaminated water",
      "tap",
      "blocked drain",
      "sewer",
      "flooding",
      "water main",
      "wet",
      "water damage",
    ],
    weight: 1.0,
  },
  electricity: {
    keywords: [
      "electricity",
      "power",
      "blackout",
      "outage",
      "short circuit",
      "broken wire",
      "electric pole",
      "transformer",
      "voltage",
      "power cut",
      "sparks",
      "electrical hazard",
      "live wire",
      "current",
      "light not working",
    ],
    weight: 1.0,
  },
  garbage: {
    keywords: [
      "garbage",
      "trash",
      "waste",
      "rubbish",
      "littered",
      "dumping",
      "dirty",
      "cleanlines",
      "sanitation",
      "waste management",
      "dump",
      "refuse",
      "collected waste",
      "bins",
    ],
    weight: 1.0,
  },
  road: {
    keywords: [
      "road",
      "street",
      "pavement",
      "pothole",
      "broken road",
      "damaged",
      "crack",
      "speedbreaker",
      "bump",
      "asphalt",
      "surface",
      "highway",
      "thoroughfare",
      "uneven",
      "traffic",
    ],
    weight: 1.0,
  },
}

function calculateSeverity(text: string, category: string): "low" | "medium" | "high" | "critical" {
  const lowerText = text.toLowerCase()

  // Critical indicators
  const criticalKeywords = [
    "danger",
    "hazard",
    "risk",
    "urgent",
    "emergency",
    "accident",
    "injury",
    "death",
    "critical",
    "severe",
    "worst",
  ]

  // High indicators
  const highKeywords = [
    "broken",
    "damaged",
    "collapsed",
    "burst",
    "flooded",
    "multiple",
    "widespread",
    "serious",
    "major",
  ]

  // Medium indicators
  const mediumKeywords = ["leaking", "slow", "partial", "occasional", "problem"]

  if (criticalKeywords.some((kw) => lowerText.includes(kw))) {
    return "critical"
  }

  if (highKeywords.some((kw) => lowerText.includes(kw))) {
    return "high"
  }

  if (mediumKeywords.some((kw) => lowerText.includes(kw))) {
    return "medium"
  }

  return "low"
}

function extractKeywords(text: string, category: string): string[] {
  const lowerText = text.toLowerCase()
  const keywords = categoryKeywords[category as keyof typeof categoryKeywords]?.keywords || []

  const foundKeywords = keywords.filter((kw) => lowerText.includes(kw.toLowerCase())).slice(0, 3)

  // If no specific keywords found, extract common words
  if (foundKeywords.length === 0) {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4 && !["water", "electricity", "garbage", "road"].includes(w))
      .slice(0, 3)
    return words
  }

  return foundKeywords
}

export function categorizeComplaint(text: string): CategoryResult {
  const lowerText = text.toLowerCase()
  let bestCategory: keyof typeof categoryKeywords = "general"
  let maxMatches = 0

  // Find best matching category
  for (const [category, data] of Object.entries(categoryKeywords)) {
    const matches = data.keywords.filter((kw) => lowerText.includes(kw.toLowerCase())).length

    if (matches > maxMatches) {
      maxMatches = matches
      bestCategory = category as keyof typeof categoryKeywords
    }
  }

  const severity = calculateSeverity(text, bestCategory)
  const keywords = extractKeywords(text, bestCategory)

  // Create summary
  let summary = `${bestCategory.charAt(0).toUpperCase() + bestCategory.slice(1)} issue reported`
  if (severity === "critical") {
    summary = `URGENT: ${summary}`
  } else if (severity === "high") {
    summary = `Important: ${summary}`
  }

  return {
    category: bestCategory as "water" | "electricity" | "garbage" | "road" | "general",
    severity,
    keywords,
    summary,
  }
}
