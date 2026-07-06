import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ label = 'جاري التحميل...', className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-16 gap-3 ${className}`}>
    <Loader2 className="animate-spin text-primary" size={32} />
    <p className="text-sm font-bold text-gray-400">{label}</p>
  </div>
);

export default LoadingSpinner;
