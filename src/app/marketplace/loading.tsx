export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 border-b-2 border-gray-200 pb-8">
          <div className="h-10 w-64 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="mt-3 h-4 w-96 max-w-full bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8 items-start">
          <div className="rounded-3xl border border-gray-200/80 bg-white p-6 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200/70 overflow-hidden">
                <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
