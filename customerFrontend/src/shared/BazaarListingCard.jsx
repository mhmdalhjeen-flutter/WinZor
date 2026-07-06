import React from 'react';
import { MapPin, Tag } from 'lucide-react';

const CONDITION_LABELS = { new: 'جديد', used: 'مستعمل' };
const TYPE_LABELS = { sell: 'بيع', buy: 'شراء', exchange: 'بدل', custom: 'حسب الطلب' };

const formatPrice = (price) =>
  `${Number(price || 0).toLocaleString('ar-IQ')} د.ع`;

const regionLabel = (listing) => {
  const parts = [listing.regionId?.name, listing.subRegionId?.name].filter(Boolean);
  return parts.join('، ') || '—';
};

const BazaarListingCard = ({ listing, onClick }) => {
  const img = listing.mainImage || listing.images?.[0];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(listing)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(listing)}
      className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer text-right"
      dir="rtl"
    >
      <div className="relative aspect-square md:aspect-[4/3] bg-gray-100">
        {img ? (
          <img
            src={img}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm font-bold">
            بدون صورة
          </div>
        )}
        <div
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black shadow-sm ${
            listing.condition === 'new' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
          }`}
        >
          {CONDITION_LABELS[listing.condition] || listing.condition}
        </div>
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-black bg-black/50 text-white">
          {TYPE_LABELS[listing.transactionType] || listing.transactionType}
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-black text-gray-900 text-base line-clamp-2">{listing.title}</h3>
          <span className="text-primary font-black text-sm shrink-0">{formatPrice(listing.price)}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-xs font-bold">
          <MapPin size={14} /> {regionLabel(listing)}
        </div>
        {listing.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.keywords.slice(0, 3).map((kw) => (
              <span key={kw} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Tag size={10} /> {kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

export { CONDITION_LABELS, TYPE_LABELS, formatPrice, regionLabel };
export default BazaarListingCard;
