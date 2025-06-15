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

    // Get or create user
    let user = await db.collection("users").findOne({
      auth0Id: session.user.sub,
    })

    if (!user) {
      // Create new user with free plan
      const newUser = {
        auth0Id: session.user.sub,
        email: session.user.email,
        name: session.user.name,
        plan: "free",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("users").insertOne(newUser)
      user = { ...newUser, _id: result.insertedId }
    }

    // Count user's projects
    const projectCount = await db.collection("projects").countDocuments({
      userId: session.user.sub,
    })

    const maxProjects = user.plan === "pro" ? 999999 : 1

    return NextResponse.json({
      plan: user.plan,
      projectCount,
      maxProjects,
      canCreateProject: projectCount < maxProjects,
    })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
