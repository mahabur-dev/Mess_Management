import { readFile } from 'node:fs/promises'
import process from 'node:process'

const configPath = new URL('../android/app/google-services.json', import.meta.url)
const expectedPackage = 'com.mess.management'
const expectedSha1 = String(process.env.EXPECTED_ANDROID_CERT_SHA1 || '')
  .replace(/[^a-fA-F0-9]/g, '')
  .toLowerCase()

try {
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  const client = config.client?.find(
    (candidate) =>
      candidate?.client_info?.android_client_info?.package_name === expectedPackage,
  )
  if (!client) throw new Error(`No Firebase client matches ${expectedPackage}`)

  const hasWebOAuthClient = client.oauth_client?.some(
    (candidate) => candidate?.client_type === 3 && candidate?.client_id,
  )
  if (!hasWebOAuthClient) {
    throw new Error(
      'Firebase config has no Web OAuth client. Add the signing SHA-1, enable Google provider, then download google-services.json again.',
    )
  }

  if (expectedSha1) {
    const hasMatchingAndroidClient = client.oauth_client?.some(
      (candidate) =>
        candidate?.client_type === 1 &&
        String(candidate?.android_info?.package_name || '') === expectedPackage &&
        String(candidate?.android_info?.certificate_hash || '')
          .replace(/[^a-fA-F0-9]/g, '')
          .toLowerCase() === expectedSha1,
    )
    if (!hasMatchingAndroidClient) {
      throw new Error(
        'Firebase config does not contain an Android OAuth client for the APK signing SHA-1.',
      )
    }
  }

  console.log(`PASS Firebase Google authentication config for ${expectedPackage}.`)
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
