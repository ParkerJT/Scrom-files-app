import { getSession } from "@auth0/nextjs-auth0"
import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const projects = await db
      .collection("projects")
      .find({ userId: session.user.sub })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check user's plan and project limit
    const user = await db.collection("users").findOne({
      auth0Id: session.user.sub,
    })

    const projectCount = await db.collection("projects").countDocuments({
      userId: session.user.sub,
    })

    const maxProjects = user?.plan === "pro" ? 999999 : 1

    if (projectCount >= maxProjects) {
      return NextResponse.json(
        { error: "Project limit reached. Upgrade to Pro for unlimited projects." },
        { status: 403 },
      )
    }

    const project = {
      name: name.trim(),
      description: description?.trim() || "",
      userId: session.user.sub,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("projects").insertOne(project)

    return NextResponse.json({
      _id: result.insertedId,
      ...project,
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
