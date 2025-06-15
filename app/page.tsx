import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Share, Shield, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SCORM Uploader</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/api/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/api/auth/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Upload SCORM Files with Ease</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload your SCORM packages and generate embeddable URLs for seamless LMS integration. Start with one free
            upload, upgrade for unlimited projects.
          </p>
          <Link href="/api/auth/login">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Uploading Free
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Upload className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Easy Upload</CardTitle>
              <CardDescription>Drag and drop your SCORM files or browse to upload. We handle the rest.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Share className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Instant Sharing</CardTitle>
              <CardDescription>Get a public URL immediately after upload. Perfect for LMS embedding.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>Your files are stored securely with enterprise-grade infrastructure.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Simple Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <CardDescription className="text-3xl font-bold text-gray-900">$0</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>1 SCORM upload
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Public URL generation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Basic support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-500 border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Pro <Zap className="h-5 w-5 text-yellow-500" />
                </CardTitle>
                <CardDescription className="text-3xl font-bold text-gray-900">$19/month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Unlimited SCORM uploads
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Custom domains
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Analytics dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Priority support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
