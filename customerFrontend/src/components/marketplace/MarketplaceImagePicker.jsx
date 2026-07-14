import React from 'react';
import { Plus, X } from 'lucide-react';

export default function MarketplaceImagePicker({
  images,
  mainImageIndex,
  onPick,
  onMainImageChange,
  onRemoveImage,
  optional = false,
  wantedMode = false,
}) {
  const emptyCount = Math.max(0, 3 - images.length);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-square">
            <button
              type="button"
              onClick={() => onMainImageChange(idx)}
              className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all ${
                mainImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
              }`}
            >
              <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => onRemoveImage(idx)}
              className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
              aria-label="حذف الصورة"
            >
              <X size={12} />
            </button>
            {mainImageIndex === idx && images.length > 1 && (
              <span className="absolute bottom-1 right-1 text-[8px] font-black bg-primary text-white px-1.5 py-0.5 rounded-md">
                رئيسية
              </span>
            )}
          </div>
        ))}

        {Array.from({ length: emptyCount }).map((_, i) => {
          const isWantedSlot = wantedMode && images.length === 0 && i === 0;
          return (
            <label
              key={`slot-${images.length + i}`}
              className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                isWantedSlot
                  ? 'border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 hover:border-orange-300'
                  : 'border-gray-200 bg-gray-50/80 hover:border-primary/40 hover:bg-primary/5 group'
              }`}
            >
              {isWantedSlot ? (
                <>
                  <span className="text-base font-black text-orange-500 tracking-wide">مطلوب</span>
                  <span className="text-[9px] font-bold text-orange-400/90">صورة اختيارية</span>
                </>
              ) : (
                <>
                  <Plus
                    size={22}
                    className="text-gray-400 group-hover:text-primary transition-colors"
                    strokeWidth={2.5}
                  />
                  <span className="text-[10px] font-black text-gray-500 group-hover:text-primary transition-colors">
                    إضافة صورة
                  </span>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPick} />
            </label>
          );
        })}
      </div>
      {!optional && images.length === 0 && (
        <p className="text-[10px] font-bold text-gray-400 text-center">أضف صورة واحدة على الأقل (حتى 3)</p>
      )}
    </div>
  );
}
