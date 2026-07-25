export function appHref(href: string) {
  if (!href || href === '/') return href || '/'
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//') || href.startsWith('#')) return href

  const [, path = '', suffix = ''] = href.match(/^([^?#]*)([?#].*)?$/) ?? []
  if (!path.startsWith('/') || path === '/' || path.endsWith('/')) return href

  const lastSegment = path.split('/').pop() ?? ''
  if (lastSegment.includes('.')) return href

  return `${path}/${suffix}`
}
