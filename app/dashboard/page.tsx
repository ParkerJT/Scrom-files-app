"use client"

import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, ExternalLink, Trash2, Crown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Project {
  _id: string
  name: string
  description: string
  scormFile?: {
    filename: string
    publicUrl: string
    uploadedAt: string
  }
  createdAt: string
}

interface UserData {
  plan: "free" | "pro"
  projectCount: number
  maxProjects: number
  canCreateProject: boolean
}

export default function DashboardPage() {
  const { user, isLoading } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/api/auth/login")
      return
    }

    if (user) {
      fetchProjects()
      fetchUserData()
    }
  }, [user, isLoading])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        console.error("Failed to fetch projects:", response.status)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user")
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        console.log("User data:", data) // Debug log
      } else {
        console.error("Failed to fetch user data:", response.status)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProjects(projects.filter((p) => p._id !== projectId))
        // Refresh user data to update project count
        fetchUserData()
        toast({
          title: "Project deleted",
          description: "Your project has been successfully deleted.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">SCORM Uploader</span>
          </div>
          <div className="flex items-center gap-4">
            {userData?.plan === "free" && (
              <Link href="/upgrade">
                <Button variant="outline" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-2">
              <img src={user?.picture || ""} alt={user?.name || ""} className="w-8 h-8 rounded-full" />
              <span className="font-medium">{user?.name}</span>
            </div>
            <Link href="/api/auth/logout">
              <Button variant="outline">Sign Out</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
            <p className="text-gray-600 mt-2">
              {userData ? `${userData.projectCount} of ${userData.maxProjects} projects used` : "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {userData && (
              <Badge variant={userData.plan === "pro" ? "default" : "secondary"}>
                {userData.plan === "pro" ? "Pro Plan" : "Free Plan"}
              </Badge>
            )}
            {userData?.canCreateProject ? (
              <Link href="/projects/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </Link>
            ) : (
              <Link href="/upgrade">
                <Button className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Upgrade to Create More
                </Button>
              </Link>
            )}
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-6">Create your first project to start uploading SCORM files.</p>
              {userData?.canCreateProject ? (
                <Link href="/projects/new">
                  <Button>Create Your First Project</Button>
                </Link>
              ) : (
                <Link href="/upgrade">
                  <Button>Upgrade to Create Projects</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1">{project.description}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProject(project._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.scormFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Upload className="h-4 w-4" />
                        {project.scormFile.filename}
                      </div>
                      <div className="flex gap-2">
                        <Link href={project.scormFile.publicUrl} target="_blank">
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(project.scormFile!.publicUrl)
                            toast({
                              title: "URL copied!",
                              description: "The public URL has been copied to your clipboard.",
                            })
                          }}
                        >
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Link href={`/projects/${project._id}/upload`}>
                      <Button size="sm" className="w-full">
                        Upload SCORM File
                      </Button>
                    </Link>
                  )}
                  <div className="text-xs text-gray-500 mt-3">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
