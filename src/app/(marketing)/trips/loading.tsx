export default function Loading() {
  return (
    <div className="bg-abyss">
      <div className="bg-forest px-6 pt-8 pb-5 sm:px-8">
        <div className="mb-3 h-2.5 w-20 animate-pulse bg-summit/10" />
        <div className="mb-3.5 h-12 w-96 max-w-full animate-pulse bg-summit/10" />
        <div className="mb-6 h-4 w-[480px] max-w-full animate-pulse bg-summit/10" />
        <div className="h-9 w-72 animate-pulse bg-summit/10" />
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 pt-6 pb-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse bg-summit/[0.04]" />
        ))}
      </div>
    </div>
  );
}
