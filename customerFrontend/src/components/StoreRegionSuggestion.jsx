import React from 'react';
import { MapPin } from 'lucide-react';

/** اقتراح منطقة بديلة عند عدم وجود نتائج */
export default function StoreRegionSuggestion({ suggestion, onApply }) {
  if (!suggestion?.region) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-right">
      <div className="flex-1">
        <p className="text-sm font-black text-amber-900 flex items-center gap-2">
          <MapPin size={16} /> لا نتائج في اختيارك الحالي
        </p>
        <p className="text-xs font-bold text-amber-800 mt-1">{suggestion.message}</p>
      </div>
      {onApply && (
        <button
          type="button"
          onClick={() => onApply(suggestion.region._id)}
          className="shrink-0 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-black hover:bg-amber-600 transition-colors"
        >
          عرض «{suggestion.region.name}»
        </button>
      )}
    </div>
  );
}
