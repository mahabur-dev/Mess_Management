import type { Metadata } from 'next'
import { AboutPageClient } from './about-page-client'

export const metadata: Metadata = {
  title: 'About Us | Messzen.com',
  description: 'Learn how Messzen makes shared living calmer through transparent meals, expenses, billing, and communication.',
}

export default function AboutPage() {
  return <AboutPageClient />
}
