const LEGACY_APP_PATHS = new Map<string, string>([
  ['/dashboard', '/'],
])

function resolveLegacyAppHref(href: string) {
  const [, path = '', suffix = ''] = href.match(/^([^?#]*)([?#].*)?$/) ?? []
  const normalizedPath = path === '/' ? path : path.replace(/\/+$/, '')
  const canonicalPath = LEGACY_APP_PATHS.get(normalizedPath) ?? path

  return `${canonicalPath}${suffix}`
}

export function appHref(href: string) {
  if (!href || href === '/') return href || '/'
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//') || href.startsWith('#')) return href

  const canonicalHref = resolveLegacyAppHref(href)
  const [, path = '', suffix = ''] = canonicalHref.match(/^([^?#]*)([?#].*)?$/) ?? []
  if (!path.startsWith('/') || path === '/' || path.endsWith('/')) return canonicalHref

  const lastSegment = path.split('/').pop() ?? ''
  if (lastSegment.includes('.')) return canonicalHref

  return `${path}/${suffix}`
}
