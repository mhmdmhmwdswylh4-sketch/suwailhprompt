export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7cf2b5" />
          <stop offset="1" stopColor="#5ad1ff" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="62" height="62" rx="17" fill="#0a0c11" stroke="rgba(255,255,255,.12)" />
      {/* "S" stroke */}
      <path
        d="M42 20c-2.5-3-6-4.5-10.5-4.5C25 15.5 21 19 21 23.5c0 10 22 5.5 22 17 0 4.8-4.4 8-10.5 8-5 0-9-1.8-11.5-5"
        fill="none"
        stroke="url(#lg)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* prompt caret ">" */}
      <path d="M46 30l6 3-6 3" fill="none" stroke="#5ad1ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={32} />
      <span className="text-[15px] font-semibold tracking-[0.18em] text-white" dir="ltr">
        SUWAILIH<span className="text-mint"> PROMPT</span>
      </span>
    </span>
  );
}
