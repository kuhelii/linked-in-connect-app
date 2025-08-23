import axios from "axios"
import type { LinkedInProfile, LocationSearchResult } from "../types"
import dotenv from "dotenv"

dotenv.config();

interface SerpApiResult {
  organic_results?: Array<{
    title: string
    link: string
    snippet?: string
    thumbnail?: string
  }>
  pagination?: {
    current: number
    next?: string
  }
}

export class LinkedInSearchService {
  private apiKey: string
  private baseUrl = "https://serpapi.com/search"

  constructor() {
    this.apiKey = process.env.SERPAPI_KEY as string
    if (!this.apiKey) {
      throw new Error("SERPAPI_KEY environment variable is required")
    }
  }

  async searchLinkedInProfiles(location: string, role = "", page = 1): Promise<LocationSearchResult> {
    try {
      // Construct search query for LinkedIn profiles
      const query = role ? `site:linkedin.com/in/ "${role}" "${location}"` : `site:linkedin.com/in/ "${location}"`

      const params = {
        engine: "google",
        q: query,
        api_key: this.apiKey,
        start: (page - 1) * 10,
        num: 10,
      }

      const response = await axios.get<SerpApiResult>(this.baseUrl, { params })
      const data = response.data

      // Filter and transform results to LinkedIn profiles
      const profiles = this.transformResults(data.organic_results || [])

      return {
        profiles,
        totalResults: profiles.length * 10, // Estimate based on page
        currentPage: page,
        hasNextPage: !!data.pagination?.next && profiles.length === 10,
      }
    } catch (error) {
      console.error("LinkedIn search error:", error)
      throw new Error("Failed to search LinkedIn profiles")
    }
  }

  private transformResults(results: SerpApiResult["organic_results"]): LinkedInProfile[] {
    if (!results) return []

    return results
      .filter((result) => {
        // Only include LinkedIn profile URLs
        return result.link && result.link.includes("linkedin.com/in/")
      })
      .map((result) => {
        // Extract name from title (usually "Name - Job Title | LinkedIn")
        const titleParts = result.title.split(" - ")
        const name = titleParts[0] || result.title

        // Extract headline/position from title or snippet
        let headline = ""
        if (titleParts.length > 1) {
          headline = titleParts[1].replace(" | LinkedIn", "").trim()
        } else if (result.snippet) {
          // Try to extract position from snippet
          const snippetLines = result.snippet.split(".")
          headline = snippetLines[0] || ""
        }

        return {
          name: name.trim(),
          headline: headline.trim(),
          link: result.link,
          position: headline.trim(),
          thumbnail: result.thumbnail || "",
        }
      })
      .slice(0, 10) // Limit to 10 results per page
  }

  async searchLinkedInProfilesByKeywords(keywords: string[], page = 1): Promise<LocationSearchResult> {
    try {
      const query = `site:linkedin.com/in/ ${keywords.join(" ")}`

      const params = {
        engine: "google",
        q: query,
        api_key: this.apiKey,
        start: (page - 1) * 10,
        num: 10,
      }

      const response = await axios.get<SerpApiResult>(this.baseUrl, { params })
      const data = response.data

      const profiles = this.transformResults(data.organic_results || [])

      return {
        profiles,
        totalResults: profiles.length * 10,
        currentPage: page,
        hasNextPage: !!data.pagination?.next && profiles.length === 10,
      }
    } catch (error) {
      console.error("LinkedIn keyword search error:", error)
      throw new Error("Failed to search LinkedIn profiles by keywords")
    }
  }
}

export const linkedinSearchService = new LinkedInSearchService()
