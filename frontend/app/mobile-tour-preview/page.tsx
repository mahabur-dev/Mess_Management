import { MarketingMobileAppTour } from '@/components/marketing-mobile-app-tour'

export default function MobileTourPreviewPage() {
  return (
    <main className="min-h-screen bg-[#eef5f6] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center lg:text-left">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#008d8c]">Standalone mobile animation preview</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#123748] sm:text-4xl">The complete Messzen app, automatically explored</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-[#607981]">This mobile tour is isolated from the landing page. It follows the real manager Home Quick Actions, footer navigation, and More drawer order using the existing Messzen mobile visual system.</p>
        </div>
        <MarketingMobileAppTour />
      </div>
    </main>
  )
}
