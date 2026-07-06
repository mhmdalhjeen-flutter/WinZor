import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorState = ({ message = 'حدث خطأ', onRetry }) => (
  <div className="py-16 text-center space-y-4 px-6">
    <AlertTriangle size={40} className="mx-auto text-red-400" />
    <p className="font-black text-red-500 text-sm">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="text-primary font-black text-sm underline">
        إعادة المحاولة
      </button>
    )}
  </div>
);

export default ErrorState;
