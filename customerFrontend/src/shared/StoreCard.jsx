import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resolveStoreLogo, storeLogoPlaceholder } from '../utils/mediaUrl';
import VerifiedBadge from '../components/marketplace/VerifiedBadge';

const StoreCard = ({ store, membershipStatus }) => {
  const navigate = useNavigate();
  const logo = resolveStoreLogo(store, { width: 320 }) || storeLogoPlaceholder(store);
  const location = store.subRegion || store.region;
  const isMember = membershipStatus === 'member';

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/store/${store._id}`)}
      className="store-card w-[218px] sm:w-[236px] shrink-0 bg-white rounded-[20px] border border-gray-100/90 shadow-[0_4px_16px_rgba(15,23,42,0.06)] overflow-hidden text-right transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.1)]"
    >
      <div className="store-card__logo-wrap h-[100px] sm:h-[106px] bg-gradient-to-br from-gray-50 to-gray-100 relative">
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
        {isMember && (
          <span className="absolute top-1.5 right-1.5 z-[1] text-[8.5px] bg-emerald-600/92 text-white px-1.5 py-0.5 rounded-full font-black shadow-sm">
            عضو
          </span>
        )}
        {membershipStatus === 'pending' && (
          <span className="absolute top-1.5 right-1.5 z-[1] text-[8.5px] bg-amber-500/92 text-white px-1.5 py-0.5 rounded-full font-black shadow-sm">
            قيد الانتظار
          </span>
        )}
      </div>

      <div className="px-2.5 py-2 space-y-1">
        <div className="space-y-0.5">
          <h4 className="font-black text-gray-900 text-[13px] leading-snug line-clamp-2">
            {store.name}
          </h4>
          {store.isVerifiedStore && <VerifiedBadge className="!text-[8px]" />}
        </div>

        <p className="text-[10.5px] text-gray-500 flex items-center gap-1 font-bold truncate">
          <MapPin size={10} className="shrink-0 text-gray-400" />
          <span className="truncate">{location}</span>
        </p>

        <div className="flex items-center text-[10.5px] font-black">
          <span className="flex items-center gap-0.5 text-amber-500">
            <Star size={11} fill="currentColor" />
            {(store.ratingAvg || 0).toFixed(1)}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

export default StoreCard;
