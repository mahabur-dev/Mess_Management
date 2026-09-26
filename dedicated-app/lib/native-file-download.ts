'use client'

import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

function blobAsBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.onload = () => {
      const value = String(reader.result ?? '')
      const separator = value.indexOf(',')
      if (separator < 0) reject(new Error('Could not encode file'))
      else resolve(value.slice(separator + 1))
    }
    reader.readAsDataURL(blob)
  })
}

function safeFilename(filename: string) {
  const cleaned = filename.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return cleaned || 'messzen-monthly-report.pdf'
}

export async function downloadFile(
  blob: Blob,
  filename: string,
  nativeCopy: { title: string; dialogTitle: string },
) {
  if (Capacitor.isNativePlatform()) {
    const data = await blobAsBase64(blob)
    try {
      const permission = await Filesystem.checkPermissions()
      if (permission.publicStorage === 'prompt' || permission.publicStorage === 'prompt-with-rationale') {
        await Filesystem.requestPermissions()
      }
      await Filesystem.writeFile({
        path: `MessZen Reports/${safeFilename(filename)}`,
        data,
        directory: Directory.Documents,
        recursive: true,
      })
      return 'native-saved' as const
    } catch {
      const result = await Filesystem.writeFile({
        path: `reports/${safeFilename(filename)}`,
        data,
        directory: Directory.Cache,
        recursive: true,
      })
      await Share.share({
        title: nativeCopy.title,
        dialogTitle: nativeCopy.dialogTitle,
        files: [result.uri],
      })
      return 'native-share' as const
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = safeFilename(filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
  return 'web' as const
}
