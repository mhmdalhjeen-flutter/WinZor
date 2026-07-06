import React from 'react';

/** خلفية موحّدة لصفحات الترحيب والمصادقة */
const WelcomeBackground = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden">
    <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-red-600/25 blur-[100px]" />
    <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-violet-600/20 blur-[90px]" />
    <div className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-amber-500/15 blur-[80px]" />
    <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:24px_24px]" />
  </div>
);

export default WelcomeBackground;
