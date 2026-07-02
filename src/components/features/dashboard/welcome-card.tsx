export function WelcomeCard({ firstName }: { firstName: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 border border-forest/12 bg-summit px-5 py-4">
      <div>
        <p className="mb-1.5 text-[13px] font-bold tracking-[0.04em] text-forest uppercase">
          Mirë se vini, {firstName}! 👋
        </p>
        <p className="max-w-[400px] text-xs leading-[1.6] text-[#3D5A47]">
          Gati për sfidën e radhës në{" "}
          <span className="text-moss">Bjeshkët e Nemuna</span>? Sot kemi kushte
          ideale për <span className="text-moss">ngjitje në lartësi mbi 2000m</span>.
        </p>
      </div>
      <svg
        width="100"
        height="80"
        viewBox="0 0 100 80"
        aria-hidden
        className="hidden shrink-0 sm:block"
      >
        <polygon points="30,70 70,20 90,70" fill="#C8E6D4" />
        <polygon points="10,70 50,15 80,70" fill="#A8D4B8" />
      </svg>
    </div>
  );
}
