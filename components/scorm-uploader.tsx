"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileArchive, ExternalLink, CheckCircle, Loader2 } from "lucide-react"

interface UploadResult {
  success: boolean
  packageId: string
  packageFolder: string
  manifestUrl: string
  launchUrl: string
  totalFiles: number
  files: { key: string; url: string }[]
}

type UploadStage = "idle" | "uploading" | "extracting" | "processing" | "finalizing" | "complete"

export default function ScormUploader() {
  const [uploading, setUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle")
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getStageMessage = (stage: UploadStage) => {
    switch (stage) {
      case "uploading":
        return "Uploading SCORM package..."
      case "extracting":
        return "Extracting ZIP file..."
      case "processing":
        return "Processing SCORM files..."
      case "finalizing":
        return "Finalizing upload..."
      case "complete":
        return "Upload completed successfully!"
      default:
        return ""
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setUploadResult(null)
    setUploadStage("uploading")

    try {
      const formData = new FormData()
      formData.append("scormPackage", file)

      // Stage progression with realistic timing
      const stageProgression = [
        { stage: "uploading" as UploadStage, delay: 500 },
        { stage: "extracting" as UploadStage, delay: 1000 },
        { stage: "processing" as UploadStage, delay: 1500 },
        { stage: "finalizing" as UploadStage, delay: 500 },
      ]

      // Start stage progression
      let currentStageIndex = 0
      const progressStages = () => {
        if (currentStageIndex < stageProgression.length) {
          const { stage, delay } = stageProgression[currentStageIndex]
          setTimeout(() => {
            setUploadStage(stage)
            currentStageIndex++
            progressStages()
          }, delay)
        }
      }
      progressStages()

      console.log("Sending upload request...")
      const response = await fetch("/api/upload-scorm", {
        method: "POST",
        body: formData,
      })

      console.log("Upload response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("Upload successful:", result)
        setUploadStage("complete")
        setUploadResult(result)
      } else {
        const error = await response.json()
        console.error("Upload failed:", error)
        throw new Error(error.error || "Upload failed")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload file")
      setUploadStage("idle")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-6 w-6" />
            SCORM Package Uploader
          </CardTitle>
          <CardDescription>Upload a SCORM package (.zip file) to extract and host the content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Choose SCORM Package</p>
                <p className="text-sm text-gray-500">Select a .zip file containing your SCORM content</p>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {uploading && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm font-medium">{getStageMessage(uploadStage)}</span>
                </div>

                {/* Stage indicators */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span className={uploadStage === "uploading" ? "text-blue-600 font-medium" : ""}>Upload</span>
                  <span className={uploadStage === "extracting" ? "text-blue-600 font-medium" : ""}>Extract</span>
                  <span className={uploadStage === "processing" ? "text-blue-600 font-medium" : ""}>Process</span>
                  <span className={uploadStage === "finalizing" ? "text-blue-600 font-medium" : ""}>Finalize</span>
                </div>

                {/* Visual progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width:
                        uploadStage === "uploading"
                          ? "25%"
                          : uploadStage === "extracting"
                            ? "50%"
                            : uploadStage === "processing"
                              ? "75%"
                              : uploadStage === "finalizing"
                                ? "90%"
                                : uploadStage === "complete"
                                  ? "100%"
                                  : "0%",
                    }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Upload Successful
            </CardTitle>
            <CardDescription>Your SCORM package has been extracted and uploaded to Cloudflare R2</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Package ID</p>
                <p className="text-sm text-gray-600 font-mono">{uploadResult.packageId}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Total Files</p>
                <p className="text-sm text-gray-600">{uploadResult.totalFiles} files extracted</p>
              </div>
            </div>

            {uploadResult.launchUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Launch URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 p-2 rounded text-sm break-all">{uploadResult.launchUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => window.open(uploadResult.launchUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {uploadResult.manifestUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Manifest URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 p-2 rounded text-sm break-all">{uploadResult.manifestUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => window.open(uploadResult.manifestUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <details className="space-y-2">
              <summary className="text-sm font-medium cursor-pointer">
                View All Files ({uploadResult.totalFiles})
              </summary>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {uploadResult.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-gray-600 break-all">{file.key}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(file.url, "_blank")}
                      className="h-6 px-2 ml-2 flex-shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
