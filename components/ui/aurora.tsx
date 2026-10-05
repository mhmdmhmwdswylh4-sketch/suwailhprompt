/** Slow drifting aurora blobs (CSS only, GPU transforms). Pattern from 21st.dev "aurora background". */
export default function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 start-[-10%] h-[520px] w-[520px] animate-aurora-a rounded-full bg-mint/[0.09] blur-[110px]" />
      <div className="absolute top-[30%] end-[-12%] h-[480px] w-[480px] animate-aurora-b rounded-full bg-ice/[0.08] blur-[120px]" />
      <div className="absolute bottom-[-20%] start-[25%] h-[420px] w-[420px] animate-aurora-a rounded-full bg-mint/[0.05] blur-[110px] [animation-delay:-9s]" />
    </div>
  );
}
