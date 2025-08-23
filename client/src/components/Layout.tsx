import type React from "react"
import { Outlet } from "react-router-dom"
import { Navigation } from "./Navigation"

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  )
}
