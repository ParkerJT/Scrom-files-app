import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { UserProvider } from "@auth0/nextjs-auth0/client"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SCORM Uploader - Upload and Share SCORM Packages",
  description: "Upload SCORM files and generate embeddable URLs for your LMS",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <UserProvider>
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </UserProvider>
    </html>
  )
}
