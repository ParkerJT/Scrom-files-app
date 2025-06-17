import { type NextRequest, NextResponse } from "next/server"
import { uploadToR2, getR2Url } from "@/lib/r2-client"
import JSZip from "jszip"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("scormPackage") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Generate unique folder for this SCORM package
    const packageId = uuidv4()
    const packageFolder = `scorm-packages/${packageId}`

    // Read the uploaded ZIP file
    const arrayBuffer = await file.arrayBuffer()
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(arrayBuffer)

    const uploadedFiles: { key: string; url: string }[] = []
    let manifestFile = ""

    // Extract and upload each file from the ZIP
    for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
      if (zipEntry.dir) continue // Skip directories

      const fileContent = await zipEntry.async("uint8array")
      const fileKey = `${packageFolder}/${relativePath}`

      // Determine content type based on file extension
      const contentType = getContentType(relativePath)

      // Upload to R2
      await uploadToR2(fileKey, fileContent, contentType)

      const fileUrl = getR2Url(fileKey)
      uploadedFiles.push({ key: fileKey, url: fileUrl })

      // Check if this is the manifest file
      if (relativePath.toLowerCase() === "imsmanifest.xml") {
        manifestFile = fileUrl
      }
    }

    // Find the launch file from manifest (simplified - you might want more robust parsing)
    let launchUrl = ""
    if (manifestFile) {
      try {
        const manifestResponse = await fetch(manifestFile)
        const manifestText = await manifestResponse.text()

        // Simple regex to find the launch file - you might want to use a proper XML parser
        const launchMatch = manifestText.match(/href="([^"]+)"/i)
        if (launchMatch) {
          const launchFile = launchMatch[1]
          launchUrl = getR2Url(`${packageFolder}/${launchFile}`)
        }
      } catch (error) {
        console.error("Error parsing manifest:", error)
      }
    }

    return NextResponse.json({
      success: true,
      packageId,
      packageFolder,
      manifestUrl: manifestFile,
      launchUrl,
      totalFiles: uploadedFiles.length,
      files: uploadedFiles,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload and extract SCORM package" }, { status: 500 })
  }
}

function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()

  const contentTypes: { [key: string]: string } = {
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    pdf: "application/pdf",
    zip: "application/zip",
  }

  return contentTypes[ext || ""] || "application/octet-stream"
}
