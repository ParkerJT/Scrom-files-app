import { S3Client } from "@aws-sdk/client-s3"
import { PutObjectCommand } from "@aws-sdk/client-s3"

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export { r2Client }

export async function uploadToR2(key: string, body: Buffer | Uint8Array | string, contentType?: string) {
  try {
    console.log(`Attempting to upload to R2: ${key}`)
    console.log(`Using account ID: ${process.env.CLOUDFLARE_R2_ACCOUNT_ID}`)
    console.log(`Using endpoint: https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`)

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })

    const result = await r2Client.send(command)
    console.log(`Successfully uploaded: ${key}`)
    return result
  } catch (error) {
    console.error(`R2 upload error for ${key}:`, error)
    throw error
  }
}

export function getR2Url(key: string) {
  // Use the public URL you have configured
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL
  if (publicUrl) {
    return `${publicUrl}/${key}`
  }

  // Fallback to default R2 URL format
  return `https://${process.env.CLOUDFLARE_R2_BUCKET_NAME}.${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
}
