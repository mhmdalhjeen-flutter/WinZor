export default function VerifiedBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full ${className}`.trim()}
    >
      <span aria-hidden>✔</span>
      متجر موثق
    </span>
  );
}
