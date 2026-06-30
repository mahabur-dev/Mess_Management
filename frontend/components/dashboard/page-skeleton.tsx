import { Loader2 } from 'lucide-react'

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafcff]">
      {/* Header skeleton */}
      <div className="border-b border-[#e6ebf4] bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-5 w-48 rounded bg-[#e6ebf4]" />
            <div className="mt-1.5 h-4 w-36 rounded bg-[#f1f5f9]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-[#2f80ed]" />
      </div>
    </div>
  )
}