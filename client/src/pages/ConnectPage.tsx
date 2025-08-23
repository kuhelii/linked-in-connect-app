"use client"

import type React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { MapPinIcon, MagnifyingGlassIcon, GlobeAltIcon } from "@heroicons/react/24/outline"

interface SearchForm {
  location: string
  role: string
}

export const ConnectPage: React.FC = () => {
  const navigate = useNavigate()
  const { register, handleSubmit } = useForm<SearchForm>()

  const onSubmit = (data: SearchForm) => {
    const params = new URLSearchParams()
    params.append("location", data.location)
    if (data.role) params.append("role", data.role)

    navigate(`/connect/${encodeURIComponent(data.location)}?${params}`)
  }

  const popularLocations = [
    "New York, NY",
    "San Francisco, CA",
    "London, UK",
    "Toronto, ON",
    "Sydney, Australia",
    "Berlin, Germany",
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Connect with Professionals</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover and connect with LinkedIn professionals by location or find users nearby.
        </p>
      </div>

      {/* Connection Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Nearby Users */}
        <div className="card">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
              <MapPinIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Find Nearby Users</h2>
            <p className="text-muted-foreground">
              Discover NetworkHub users in your immediate area using location services.
            </p>
            <Link to="/connect/nearby" className="btn-primary w-full">
              <MapPinIcon className="w-5 h-5 mr-2" />
              Find Nearby Users
            </Link>
          </div>
        </div>

        {/* Location Search */}
        <div className="card">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <GlobeAltIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Search by Location</h2>
            <p className="text-muted-foreground">Find LinkedIn professionals in any city or region worldwide.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input
                {...register("location", { required: true })}
                type="text"
                placeholder="Enter city or location"
                className="input-field"
              />
              <input {...register("role")} type="text" placeholder="Role or title (optional)" className="input-field" />
              <button type="submit" className="btn-primary w-full">
                <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                Search LinkedIn Profiles
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Popular Locations */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Popular Locations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {popularLocations.map((location) => (
            <Link
              key={location}
              to={`/connect/${encodeURIComponent(location)}`}
              className="card hover:shadow-md transition-shadow text-center group"
            >
              <div className="space-y-2">
                <GlobeAltIcon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mx-auto" />
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">{location}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="card bg-muted/50">
        <h2 className="text-2xl font-bold text-foreground mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold">1</span>
            </div>
            <h3 className="font-semibold text-foreground">Search</h3>
            <p className="text-sm text-muted-foreground">
              Enter a location or use your current position to find professionals
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold">2</span>
            </div>
            <h3 className="font-semibold text-foreground">Discover</h3>
            <p className="text-sm text-muted-foreground">Browse through LinkedIn profiles and NetworkHub users</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold">3</span>
            </div>
            <h3 className="font-semibold text-foreground">Connect</h3>
            <p className="text-sm text-muted-foreground">Send friend requests and build your professional network</p>
          </div>
        </div>
      </div>
    </div>
  )
}
