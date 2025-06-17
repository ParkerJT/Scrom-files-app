import { type NextRequest, NextResponse } from "next/server"
import { uploadToR2, getR2Url } from "@/lib/r2-client"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import JSZip from "jszip"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("scormPackage") as File
    const projectId = formData.get("projectId") as string

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "No project ID provided" }, { status: 400 })
    }

    console.log(`Processing SCORM upload for project: ${projectId}`)

    // Generate unique folder for this SCORM package
    const packageId = randomUUID()
    const packageFolder = `scorm-packages/${packageId}`

    // Read the uploaded ZIP file
    const arrayBuffer = await file.arrayBuffer()
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(arrayBuffer)

    const uploadedFiles: { key: string; url: string }[] = []
    let manifestFile = ""
    let manifestContent = ""

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

      // Check if this is the manifest file and store its content
      if (relativePath.toLowerCase() === "imsmanifest.xml") {
        manifestFile = fileUrl
        manifestContent = await zipEntry.async("text")
      }
    }

    // Find the launch file - prioritize story.html, then index.html
    let launchUrl = ""
    let launchFile = ""

    console.log("Looking for launch files...")
    console.log(
      "Available HTML files:",
      uploadedFiles.filter((f) => f.key.toLowerCase().endsWith(".html")).map((f) => f.key),
    )

    // 1. First check for story.html (Articulate Storyline)
    const storyFile = uploadedFiles.find((f) => f.key.toLowerCase().endsWith("story.html"))
    if (storyFile) {
      launchFile = "story.html"
      launchUrl = storyFile.url
      console.log(`✅ Found story.html: ${launchUrl}`)
    }

    // 2. If no story.html, check for index.html
    if (!launchFile) {
      const indexFile = uploadedFiles.find((f) => f.key.toLowerCase().endsWith("index.html"))
      if (indexFile) {
        launchFile = "index.html"
        launchUrl = indexFile.url
        console.log(`✅ Found index.html: ${launchUrl}`)
      }
    }

    // 3. If neither found, log what HTML files we do have
    if (!launchFile) {
      const htmlFiles = uploadedFiles.filter(
        (f) => f.key.toLowerCase().endsWith(".html") || f.key.toLowerCase().endsWith(".htm"),
      )
      console.log("❌ No story.html or index.html found")
      console.log(
        "Available HTML files:",
        htmlFiles.map((f) => f.key),
      )

      // Use the first HTML file as fallback
      if (htmlFiles.length > 0) {
        const fallbackFile = htmlFiles[0]
        launchUrl = fallbackFile.url
        launchFile = fallbackFile.key.split("/").pop() || "unknown.html"
        console.log(`⚠️ Using fallback HTML file: ${launchFile}`)
      }
    }

    // Save to MongoDB
    const { db } = await connectToDatabase()

    // Update the project with SCORM file information
    const scormFileData = {
      filename: file.name,
      packageId: packageId,
      packageFolder: packageFolder,
      publicUrl: launchUrl || manifestFile,
      manifestUrl: manifestFile,
      launchUrl: launchUrl,
      launchFile: launchFile,
      totalFiles: uploadedFiles.length,
      uploadedAt: new Date(),
      fileSize: file.size,
    }

    const updateResult = await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          scormFile: scormFileData,
          updatedAt: new Date(),
        },
      },
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log(`🎯 Final Results:`)
    console.log(`   Launch File: ${launchFile}`)
    console.log(`   Launch URL: ${launchUrl}`)
    console.log(`   Manifest URL: ${manifestFile}`)
    console.log(`   Total Files: ${uploadedFiles.length}`)

    return NextResponse.json({
      success: true,
      packageId,
      packageFolder,
      manifestUrl: manifestFile,
      launchUrl,
      launchFile,
      totalFiles: uploadedFiles.length,
      files: uploadedFiles,
      projectUpdated: true,
      scormData: scormFileData,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload and extract SCORM package",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
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
