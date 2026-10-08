import { readFile } from 'node:fs/promises'
import process from 'node:process'

const configPath = new URL('../android/app/google-services.json', import.meta.url)
const expectedPackage = 'com.mess.management'
const expectedSha1 = String(process.env.EXPECTED_ANDROID_CERT_SHA1 || '')
  .replace(/[^a-fA-F0-9]/g, '')
  .toLowerCase()
const expectedPlaySha1 = String(process.env.EXPECTED_PLAY_APP_SIGNING_CERT_SHA1 || '')
  .replace(/[^a-fA-F0-9]/g, '')
  .toLowerCase()
const requirePlaySha1 = process.env.REQUIRE_PLAY_APP_SIGNING_SHA1 === 'true'

function normalizeSha1(value) {
  return String(value || '')
    .replace(/[^a-fA-F0-9]/g, '')
    .toLowerCase()
}

function formatSha1(value) {
  return normalizeSha1(value)
    .toUpperCase()
    .match(/.{1,2}/g)
    ?.join(':') || '(missing)'
}

function androidOAuthSha1s(clients) {
  return [
    ...new Set(
      clients.flatMap((client) =>
        (client.oauth_client || [])
          .filter(
            (candidate) =>
              candidate?.client_type === 1 &&
              String(candidate?.android_info?.package_name || '') === expectedPackage,
          )
          .map((candidate) => normalizeSha1(candidate.android_info?.certificate_hash))
          .filter(Boolean),
      ),
    ),
  ]
}

function hasAndroidOAuthClient(clients, sha1) {
  return androidOAuthSha1s(clients).includes(normalizeSha1(sha1))
}

try {
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  const clients = config.client?.filter(
    (candidate) =>
      candidate?.client_info?.android_client_info?.package_name === expectedPackage,
  )
  if (!clients?.length) throw new Error(`No Firebase client matches ${expectedPackage}`)

  const configuredSha1s = androidOAuthSha1s(clients)
  console.log(
    `Firebase Android OAuth SHA-1 fingerprints: ${configuredSha1s.map(formatSha1).join(', ') || '(none)'}`,
  )

  const hasWebOAuthClient = clients.some(
    (client) =>
      client.oauth_client?.some(
        (candidate) => candidate?.client_type === 3 && candidate?.client_id,
      ),
  )
  if (!hasWebOAuthClient) {
    throw new Error(
      'Firebase config has no Web OAuth client. Add the signing SHA-1, enable Google provider, then download google-services.json again.',
    )
  }

  if (expectedSha1) {
    if (!hasAndroidOAuthClient(clients, expectedSha1)) {
      throw new Error(
        `Firebase config does not contain an Android OAuth client for the APK signing SHA-1 ${formatSha1(expectedSha1)}. JSON contains: ${configuredSha1s.map(formatSha1).join(', ') || '(none)'}.`,
      )
    }
  }

  if (requirePlaySha1 && !expectedPlaySha1) {
    throw new Error(
      'PLAY_APP_SIGNING_CERT_SHA1 is required for a Play AAB build. Copy the app-signing SHA-1 from Play Console App integrity.',
    )
  }

  if (expectedPlaySha1 && !hasAndroidOAuthClient(clients, expectedPlaySha1)) {
    throw new Error(
      `Firebase config does not contain an Android OAuth client for the Google Play app-signing SHA-1 ${formatSha1(expectedPlaySha1)}. JSON contains: ${configuredSha1s.map(formatSha1).join(', ') || '(none)'}.`,
    )
  }

  const playSuffix = expectedPlaySha1 ? ' and Google Play app signing' : ''
  console.log(`PASS Firebase Google authentication config for ${expectedPackage}${playSuffix}.`)
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
