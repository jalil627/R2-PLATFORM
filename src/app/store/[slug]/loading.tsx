export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-56 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-4 w-40 bg-gray-100 rounded-full animate-pulse" />
          </div>
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
  )
}
