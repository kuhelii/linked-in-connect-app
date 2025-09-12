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
      {/* Hero / Search */}
      <div className="bg-gradient-to-br from-primary/6 to-accent/6 rounded-2xl p-6 md:p-8 shadow-md">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Find professionals nearby or across the globe</h1>
            <p className="text-lg text-muted-foreground max-w-xl">Quickly search LinkedIn profiles by city, region, or role — or discover users near you.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-3">
                <label className="sr-only">Location</label>
                <div className="relative">
                  <input
                    {...register("location", { required: true })}
                    type="text"
                    placeholder="Enter city or 'Near me'"
                    className="input-field w-full pr-10 rounded-md border border-border/20 bg-card p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                </div>
                <div className="text-xs text-muted-foreground mt-2">Tip: try "San Francisco, CA" or "Near me"</div>
              </div>

              <div className="sm:col-span-1">
                <label className="sr-only">Role</label>
                <select {...register("role")} className="w-full rounded-md border border-border/20 bg-card p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition">
                  <option value="">Any role</option>
                  <option>Software Engineer</option>
                  <option>Product Manager</option>
                  <option>Designer</option>
                  <option>Sales</option>
                  <option>Marketing</option>
                </select>
              </div>
              <div className="sm:col-span-4">
                <button type="submit" className="btn-primary w-full mt-2 py-3 rounded-md text-sm font-semibold shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition">
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2 inline-block" />
                  Search
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="card p-5 bg-card/70 group hover:shadow-lg transition-shadow rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center text-white">
                  <MapPinIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">Find Nearby Users</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground/90">Discover CoonectIN users in your immediate area using location services.</p>
                </div>
              </div>
              <Link to="/connect/nearby" className="mt-4 w-full inline-flex items-center justify-center bg-primary text-primary-foreground font-semibold py-3 rounded-md shadow-md transition transform group-hover:scale-102">
                <MapPinIcon className="w-5 h-5 mr-2" />
                Find Nearby Users
              </Link>
            </div>

            <div className="card p-5 bg-card/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                  <GlobeAltIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Search by Location</h3>
                  <p className="text-sm text-muted-foreground">Find LinkedIn professionals in any city or region worldwide.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Locations */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Popular Locations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {popularLocations.map((location) => (
            <Link
              key={location}
              to={`/connect/${encodeURIComponent(location)}`}
              className="rounded-lg border border-border/50 p-3 text-center hover:shadow-md transition-shadow group bg-card"
            >
              <GlobeAltIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary mx-auto" />
              <h3 className="text-sm mt-2 font-medium text-foreground truncate group-hover:text-primary">{location}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* How it works - feature tiles */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">1</div>
            <div>
              <h3 className="font-semibold text-foreground">Search</h3>
              <p className="text-sm text-muted-foreground">Enter a location or use your current position to find professionals.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">2</div>
            <div>
              <h3 className="font-semibold text-foreground">Discover</h3>
              <p className="text-sm text-muted-foreground">Browse LinkedIn profiles and ConnectiN users in your area.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">3</div>
            <div>
              <h3 className="font-semibold text-foreground">Connect</h3>
              <p className="text-sm text-muted-foreground">Send connection requests and grow your professional network.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
