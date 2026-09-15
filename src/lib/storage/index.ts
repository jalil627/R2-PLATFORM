import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createHmac } from 'crypto'
import { v4 as uuid } from 'uuid'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || undefined,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
})

const BUCKET = process.env.S3_BUCKET || ''
const PUBLIC_URL = process.env.S3_PUBLIC_URL || ''

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'storage', 'uploads')

export interface UploadResult {
  key: string
  url: string
  size: number
}

export function isStorageConfigured(): boolean {
  return !!(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY)
}

async function ensureLocalDir(): Promise<void> {
  await fs.promises.mkdir(LOCAL_UPLOAD_DIR, { recursive: true })
}

// Folders whose objects are served publicly (images shown on the site).
export const PUBLIC_FOLDERS = ['product-images', 'store-logos', 'avatars'] as const
// Folders holding paid deliverables — only ever served through a signed URL.
export const PRIVATE_FOLDERS = ['uploads', 'product-files'] as const
export const ALLOWED_UPLOAD_FOLDERS: readonly string[] = [...PUBLIC_FOLDERS, ...PRIVATE_FOLDERS]

export function isPublicFolder(folder: string): boolean {
  return (PUBLIC_FOLDERS as readonly string[]).includes(folder)
}

/** Rejects any folder outside the allow-list (blocks `../` traversal into the web root). */
export function assertAllowedFolder(folder: string): string {
  if (!ALLOWED_UPLOAD_FOLDERS.includes(folder)) {
    throw new Error(`Invalid upload folder: ${folder}`)
  }
  return folder
}

/** Only a short alphanumeric extension survives; anything else is dropped. */
function safeExtension(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase()
  return /^\.[a-z0-9]{1,12}$/.test(ext) ? ext : ''
}

function storageKey(originalName: string, folder: string): string {
  return `${assertAllowedFolder(folder)}/${uuid()}${safeExtension(originalName)}`
}

export async function uploadFile(
  file: Buffer,
  originalName: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  const key = storageKey(originalName, folder)

  if (isStorageConfigured()) {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: getContentType(path.extname(originalName)),
    }))
    return {
      key,
      url: `${PUBLIC_URL}/${key}`,
      size: file.length,
    }
  }

  await ensureLocalDir()
  const absolute = path.resolve(LOCAL_UPLOAD_DIR, key)
  // Defence in depth: never write outside the upload root even if a key slips through.
  if (!absolute.startsWith(LOCAL_UPLOAD_DIR + path.sep)) {
    throw new Error('Invalid storage key')
  }
  await fs.promises.mkdir(path.dirname(absolute), { recursive: true })
  await fs.promises.writeFile(absolute, file)
  return {
    key,
    url: `local://${key}`,
    size: file.length,
  }
}

function fileSigningSecret(): string {
  const secret = process.env.FILE_SIGNING_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  // Fail closed: a hardcoded default would let anyone forge download signatures.
  if (!secret) {
    throw new Error('FILE_SIGNING_SECRET (or AUTH_SECRET) must be set to sign download URLs')
  }
  return secret
}

export function signDownloadPath(key: string, expiresInSeconds = 3600): { path: string; expires: number; signature: string } {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds
  const signature = createHmac('sha256', fileSigningSecret())
    .update(`${key}.${expires}`)
    .digest('hex')
  return { path: key, expires, signature }
}

export function verifyDownloadSignature(key: string, expires: number, signature: string): boolean {
  const expected = createHmac('sha256', fileSigningSecret())
    .update(`${key}.${expires}`)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return a.equals(b) && expires > Math.floor(Date.now() / 1000)
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  if (isStorageConfigured()) {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    return getSignedUrl(s3, command, { expiresIn })
  }

  const { path: safeKey, expires, signature } = signDownloadPath(key, expiresIn)
  const base = process.env.PLATFORM_URL || 'http://localhost:3000'
  const params = new URLSearchParams({
    key: safeKey,
    exp: String(expires),
    sig: signature,
  })
  return `${base}/api/files/serve?${params.toString()}`
}

export function getPublicImageUrl(key: string): string {
  if (isStorageConfigured()) {
    return `${PUBLIC_URL}/${key}`
  }
  return `/api/assets?key=${encodeURIComponent(key)}`
}

export async function readLocalFile(key: string): Promise<Buffer> {
  const absolute = path.resolve(LOCAL_UPLOAD_DIR, key)
  if (!absolute.startsWith(LOCAL_UPLOAD_DIR + path.sep) && absolute !== LOCAL_UPLOAD_DIR) {
    throw new Error('Invalid file key')
  }
  return readFile(absolute)
}

export async function deleteFile(key: string): Promise<void> {
  if (isStorageConfigured()) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    return
  }
  const absolute = path.resolve(LOCAL_UPLOAD_DIR, key)
  if (absolute.startsWith(LOCAL_UPLOAD_DIR + path.sep)) {
    await fs.promises.rm(absolute, { force: true })
  }
}

export function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
  return types[ext.toLowerCase()] || 'application/octet-stream'
}