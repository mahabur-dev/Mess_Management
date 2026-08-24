import { ProductTourPreviewSuite } from '@/components/product-tour/product-tour-preview-suite'

export default function ProductTourPreviewPage() {
  return (
    <main className="min-h-screen bg-[#eef5f6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#008d8c]">Standalone animation preview</p>
          <h1 className="mt-1.5 text-2xl font-black tracking-tight text-[#123748] sm:text-3xl">Messzen product tour suite</h1>
          <p className="mx-auto mt-1.5 max-w-2xl text-xs font-medium leading-5 text-[#607981]">These previews are not connected to the landing page. Review each cursor flow, pacing, copy, and proportion before choosing the final placement.</p>
        </div>
        <ProductTourPreviewSuite />
      </div>
    </main>
  )
}
