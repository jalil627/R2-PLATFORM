export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-[4/3] rounded-3xl bg-gray-100 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-12 w-40 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-12 w-full bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
