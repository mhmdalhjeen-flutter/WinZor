import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Tag, Heart, FolderOpen } from 'lucide-react';
import { formatListingPrice } from '../utils/currency';
import { getCategoryLabel } from '../utils/bazaarCategories';
import { CONDITION_LABELS, getConditionStyle } from '../utils/bazaarConditions';
import { resolveImageUrl, cloudinarySrcSet } from '../utils/mediaUrl';

const TYPE_LABELS = {
  sell: 'بيع',
  buy: 'شراء',
  exchange: 'بدل',
  custom: 'مطلوب',
  rent: 'إيجار',
};

const TYPE_COLORS = {
  sell: 'bg-emerald-600/90',
  exchange: 'bg-teal-600/90',
  custom: 'bg-orange-600/90',
  rent: 'bg-blue-600/90',
  buy: 'bg-gray-600/90',
};

const regionLabel = (listing) => {
  const parts = [listing.regionId?.name, listing.subRegionId?.name].filter(Boolean);
  return parts.join('، ') || '—';
};

const formatPrice = (price, currency) => formatListingPrice({ price, currency });

const BazaarListingCard = ({
  listing,
  onClick,
  favorited = false,
  onToggleFavorite,
  isPulsing = false,
}) => {
  const imgRaw = listing.mainImage || listing.images?.[0];
  const img = imgRaw ? resolveImageUrl(imgRaw, { width: 300 }) : null;
  const imgSrcSet = cloudinarySrcSet(imgRaw, [300, 600]);
  const isWanted = listing.transactionType === 'custom';
  const condStyle = getConditionStyle(listing.condition);
  const showPrice = !(isWanted && !listing.price);

  const handleFav = (e) => {
    e.stopPropagation();
    onToggleFavorite?.(listing, e);
  };

  return (
    <motion.article
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(listing)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(listing)}
      animate={isPulsing ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer text-right marketplace-listing-card"
      dir="rtl"
    >
      <div className="flex gap-3 p-2.5">
        <div className="relative w-[7.5rem] h-[7.5rem] sm:w-32 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-gray-100">
          {img ? (
            <img
              src={img}
              srcSet={imgSrcSet}
              sizes="128px"
              alt={listing.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : isWanted ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
              <span className="text-lg font-black text-orange-500">مطلوب</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">
              بدون صورة
            </div>
          )}
          <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black text-white shadow-sm ${TYPE_COLORS[listing.transactionType] || 'bg-gray-600/90'}`}>
            {TYPE_LABELS[listing.transactionType] || listing.transactionType}
          </div>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFav}
              aria-label={favorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              className={`absolute bottom-1.5 left-1.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90 ${
                favorited
                  ? 'bg-white text-rose-500 ring-1 ring-rose-200/60'
                  : 'bg-white/95 text-gray-300 hover:text-gray-400 ring-1 ring-gray-200/80'
              }`}
            >
              <Heart size={16} fill={favorited ? 'currentColor' : 'none'} strokeWidth={favorited ? 2 : 1.75} />
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5">
              {listing.title}
            </h3>
            {showPrice && (
              <p className="text-primary font-black text-base leading-none mb-2">
                {formatListingPrice(listing)}
              </p>
            )}
            {isWanted && !listing.price && (
              <p className="text-orange-600 font-black text-xs mb-2">طلب شراء</p>
            )}
          </div>

          <div className="space-y-1.5">
            {listing.condition && listing.transactionType !== 'custom' && (
              <span className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-md ${condStyle.soft}`}>
                {CONDITION_LABELS[listing.condition] || listing.condition}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-gray-500">
              {listing.category && (
                <span className="inline-flex items-center gap-0.5 text-violet-600">
                  <FolderOpen size={11} />
                  {getCategoryLabel(listing.category)}
                </span>
              )}
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={11} className="text-emerald-500 shrink-0" />
                <span className="truncate">{regionLabel(listing)}</span>
              </span>
            </div>
            {listing.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {listing.keywords.slice(0, 2).map((kw) => (
                  <span key={kw} className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <Tag size={9} /> {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export { CONDITION_LABELS, TYPE_LABELS, formatPrice, regionLabel };
export default BazaarListingCard;
