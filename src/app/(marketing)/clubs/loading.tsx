export default function Loading() {
  return (
    <>
      <section className="bg-mist px-6 pt-10 pb-9 sm:px-10">
        <div className="mb-3 h-2.5 w-24 animate-pulse bg-forest/10" />
        <div className="mb-3.5 h-9 w-72 animate-pulse bg-forest/10" />
        <div className="mb-7 h-4 w-96 max-w-full animate-pulse bg-forest/10" />
        <div className="h-11 w-full max-w-[380px] animate-pulse bg-summit" />
      </section>
      <div className="h-12 bg-forest" />
      <section className="bg-mist px-6 pt-8 pb-10 sm:px-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse bg-pine/40" />
          ))}
        </div>
      </section>
    </>
  );
}
