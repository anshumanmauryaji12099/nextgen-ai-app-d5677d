/** Client-side upload validation. The server re-validates in milestone 5. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_FILES = 5

export const IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]
const DOC_EXTENSIONS = [
  'pdf',
  'txt',
  'md',
  'csv',
  'json',
  'docx',
  'html',
  'css',
  'js',
  'ts',
  'py',
]
export const ACCEPT_ATTACHMENTS = [
  ...IMAGE_TYPES,
  ...DOC_EXTENSIONS.map((e) => `.${e}`),
].join(',')
export const ACCEPT_IMAGES = IMAGE_TYPES.join(',')

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function validateFile(
  file: File,
  { imagesOnly = false } = {},
): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const isImage = IMAGE_TYPES.includes(file.type)
  if (imagesOnly && !isImage)
    return `${file.name}: use a PNG, JPG, WebP or GIF image.`
  if (!isImage && !DOC_EXTENSIONS.includes(ext))
    return `${file.name}: this file type isn’t supported.`
  if (file.size > MAX_FILE_BYTES)
    return `${file.name} is ${formatBytes(file.size)} — the limit is 10 MB.`
  if (file.size === 0) return `${file.name} is empty.`
  return null
}
