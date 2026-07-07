import React from 'react';

const AuthOrDivider = () => (
  <div className="relative flex items-center gap-3 py-1" aria-hidden>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/20 to-white/10" />
    <span className="shrink-0 text-[11px] font-bold tracking-wide text-white/40">أو</span>
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-white/10" />
  </div>
);

export default AuthOrDivider;
