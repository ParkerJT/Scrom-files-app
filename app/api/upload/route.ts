import { getSession } from "@auth0/nextjs-auth0"
import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string

    if (!file || !projectId) {
      return NextResponse.json({ error: "File and project ID are required" }, { status: 400 })
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json({ error: "Only ZIP files are allowed" }, { status: 400 })
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      return NextResponse.json({ error: "File size must be less than 100MB" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verify project ownership
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      userId: session.user.sub,
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // TODO: Upload to Cloudflare R2
    // For now, we'll simulate the upload and generate a mock URL
    const publicUrl = `https://your-r2-domain.com/scorm/${projectId}/${file.name}`

    // Update project with file info
    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          scormFile: {
            filename: file.name,
            publicUrl,
            uploadedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      publicUrl,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
