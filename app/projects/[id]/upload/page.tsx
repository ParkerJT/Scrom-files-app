"use client"

import type React from "react"
import { useState, useCallback, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Upload, FileText, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface UploadPageProps {
  params: Promise<{
    id: string
  }>
}

export default function UploadPage({ params }: UploadPageProps) {
  // Unwrap the async params using React.use()
  const resolvedParams = use(params)
  const projectId = resolvedParams.id

  const { user, isLoading: userLoading } = useUser()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Create a ref for the file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/api/auth/login")
    }
  }, [user, userLoading, router])

  // Function to trigger file input
  const triggerFileInput = () => {
    console.log("Triggering file input...")
    if (fileInputRef.current) {
      fileInputRef.current.click()
    } else {
      console.error("File input ref is null")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed")
    const files = e.target.files
    if (files && files[0]) {
      const selectedFile = files[0]
      console.log("Selected file:", selectedFile.name, selectedFile.type, selectedFile.size)

      if (selectedFile.name.toLowerCase().endsWith(".zip")) {
        setFile(selectedFile)
        toast({
          title: "File selected",
          description: `Selected: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a ZIP file containing your SCORM package.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      console.log("File dropped")
      const files = e.dataTransfer.files
      if (files && files[0]) {
        const selectedFile = files[0]
        console.log("Dropped file:", selectedFile.name, selectedFile.type, selectedFile.size)

        if (selectedFile.name.toLowerCase().endsWith(".zip")) {
          setFile(selectedFile)
          toast({
            title: "File dropped",
            description: `Selected: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
          })
        } else {
          toast({
            title: "Invalid file type",
            description: "Please select a ZIP file containing your SCORM package.",
            variant: "destructive",
          })
        }
      }
    },
    [toast],
  )

  const handleUpload = async () => {
    if (!file) return

    console.log("Starting upload for file:", file.name)
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("scormPackage", file)
      formData.append("projectId", projectId)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      console.log("Sending upload request...")
      const response = await fetch("/api/upload-scorm", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      console.log("Upload response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("Upload successful:", result)
        setUploadProgress(100)
        toast({
          title: "Upload successful!",
          description: `SCORM package extracted with ${result.totalFiles} files. Launch URL: ${result.launchUrl}`,
        })

        // Optionally redirect to a results page or show the URLs
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        const error = await response.json()
        console.error("Upload failed:", error)
        throw new Error(error.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Upload SCORM File</CardTitle>
              <CardDescription>
                Upload a ZIP file containing your SCORM package. We'll extract and host it for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!file ? (
                <div className="space-y-4">
                  {/* Debug info */}
                  <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                    <strong>Debug:</strong> Project ID: {projectId}
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />

                  {/* Click area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={triggerFileInput}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Drop your SCORM ZIP file here</h3>
                    <p className="text-gray-600 mb-4">or click anywhere in this area to browse and select a file</p>

                    <Button
                      variant="outline"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        triggerFileInput()
                      }}
                    >
                      Browse Files
                    </Button>
                  </div>

                  {/* Alternative direct file input (visible) */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Or use this file selector:</label>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    {!uploading && (
                      <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                        Remove
                      </Button>
                    )}
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {uploadProgress === 100 ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Upload completed successfully!</span>
                    </div>
                  ) : (
                    <Button onClick={handleUpload} disabled={uploading} className="w-full">
                      {uploading ? "Uploading..." : "Upload SCORM File"}
                    </Button>
                  )}
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">SCORM Requirements:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• File must be a ZIP archive</li>
                  <li>• Must contain a valid SCORM package</li>
                  <li>• Maximum file size: 100MB</li>
                  <li>• Supported versions: SCORM 1.2 and SCORM 2004</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
