"use client"

import type React from "react"
import { useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "react-query"
import { MagnifyingGlassIcon, LinkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { connectService } from "../services/connectService"

export const ConnectLocationPage: React.FC = () => {
  const { location } = useParams<{ location: string }>()
  const [searchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [role, setRole] = useState(searchParams.get("role") || "")

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["locationSearch", location, role, currentPage],
    () => connectService.searchByLocation(decodeURIComponent(location!), role, currentPage),
    {
      enabled: !!location,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  )

  const handleSearch = () => {
    setCurrentPage(1)
    refetch()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">LinkedIn Profiles in {decodeURIComponent(location!)}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover and connect with professionals in this location
        </p>
      </div>

      {/* Search Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Filter by role or title (optional)"
              className="input-field"
            />
          </div>
          <button onClick={handleSearch} disabled={isLoading} className="btn-primary">
            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="card bg-destructive/10 border-destructive/20">
          <p className="text-destructive">Failed to search LinkedIn profiles. Please try again.</p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchResults && searchResults.profiles.length === 0 && (
        <div className="card text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <MagnifyingGlassIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No profiles found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms or search in a different location.</p>
          </div>
        </div>
      )}

      {searchResults && searchResults.profiles.length > 0 && (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Showing {searchResults.profiles.length} profiles on page {currentPage}
            </p>
            <p className="text-sm text-muted-foreground">{role && `Filtered by: ${role}`}</p>
          </div>

          {/* Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {searchResults.profiles.map((profile, index) => (
              <div key={`${profile.link}-${index}`} className="card">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {profile.thumbnail ? (
                        <img
                          src={profile.thumbnail || "/placeholder.svg"}
                          alt={profile.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground font-medium text-xl">
                            {profile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{profile.name}</h3>
                      {profile.headline && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.headline}</p>
                      )}
                      {profile.position && profile.position !== profile.headline && (
                        <p className="text-xs text-muted-foreground mt-1">{profile.position}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">LinkedIn Profile</span>
                    <a
                      href={profile.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline text-sm px-3 py-1"
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      View Profile
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(currentPage > 1 || searchResults.hasNextPage) && (
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Previous
              </button>
              <span className="text-muted-foreground">Page {currentPage}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!searchResults.hasNextPage}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="w-5 h-5 ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
