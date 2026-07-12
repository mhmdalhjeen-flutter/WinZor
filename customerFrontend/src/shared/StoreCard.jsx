import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resolveStoreLogo, storeLogoPlaceholder } from '../utils/mediaUrl';
import VerifiedBadge from '../components/marketplace/VerifiedBadge';

const StoreCard = ({ store, membershipStatus }) => {
  const navigate = useNavigate();
  const logo = resolveStoreLogo(store) || storeLogoPlaceholder(store);
  const location = store.subRegion || store.region;
  const categoryLabel = store.category?.includes(' › ')
    ? store.category.split(' › ').pop()
    : store.category;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/store/${store._id}`)}
      className="store-card w-[196px] sm:w-[208px] shrink-0 bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_24px_rgba(15,23,42,0.08)] overflow-hidden text-right transition-shadow hover:shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
    >
      <div className="store-card__logo-wrap h-[108px] sm:h-[116px] bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <img
          src={logo}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        {store.isVerifiedStore && (
          <span className="store-card__verified-dot" aria-hidden />
        )}
      </div>

      <div className="p-3.5 sm:p-4 space-y-2">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-black text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
              {store.name}
            </h4>
          </div>
          {store.isVerifiedStore && <VerifiedBadge className="!text-[9px]" />}
        </div>

        {categoryLabel && (
          <p className="text-[10px] font-black text-primary/80 truncate">{categoryLabel}</p>
        )}

        <p className="text-[11px] text-gray-500 flex items-center gap-1 font-bold truncate">
          <MapPin size={11} className="shrink-0 text-gray-400" />
          <span className="truncate">{location}</span>
        </p>

        <div className="flex items-center justify-between text-[11px] font-black pt-0.5">
          <span className="flex items-center gap-1 text-amber-500">
            <Star size={12} fill="currentColor" />
            {(store.ratingAvg || 0).toFixed(1)}
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <Users size={12} />
            {store.customersCount || 0}
          </span>
        </div>

        {membershipStatus === 'pending' && (
          <span className="text-[9px] bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full inline-block font-black">
            قيد الانتظار
          </span>
        )}
        {membershipStatus === 'member' && (
          <span className="text-[9px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full inline-block font-black">
            عضو
          </span>
        )}
      </div>
    </motion.button>
  );
};

export default StoreCard;
