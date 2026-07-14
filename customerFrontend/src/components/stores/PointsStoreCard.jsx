import React from 'react';
import { MapPin, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VerifiedBadge from '../marketplace/VerifiedBadge';
import {
  resolveStoreCover,
  resolveStoreLogo,
  storeLogoPlaceholder,
} from '../../utils/mediaUrl';

const PointsStoreCard = ({ store }) => {
  const navigate = useNavigate();
  const logo = resolveStoreLogo(store, { width: 150 }) || storeLogoPlaceholder(store);
  const cover = resolveStoreCover(store, { width: 600 });
  const categoryLabel = store.category?.includes(' › ')
    ? store.category.split(' › ').pop()
    : store.category;
  const location = [store.subRegion, store.region].filter(Boolean).join('، ') || store.region;

  return (
    <article className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden text-right">
      <div className="relative h-28 bg-gradient-to-br from-indigo-50 to-violet-100">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-indigo-200">
            <Store size={32} />
          </div>
        )}
        <div className="absolute -bottom-5 right-4 w-12 h-12 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-white">
          <img src={logo} alt="" loading="lazy" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="pt-7 px-4 pb-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-2">{store.name}</h3>
          {store.isVerifiedStore && <VerifiedBadge className="!text-[9px] shrink-0" />}
        </div>

        {categoryLabel && (
          <p className="text-[10px] font-black text-primary/80">{categoryLabel}</p>
        )}

        {location && (
          <p className="text-[11px] text-gray-500 font-bold flex items-center gap-1">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}

        {store.description && (
          <p className="text-[11px] text-gray-600 font-medium leading-relaxed line-clamp-2">
            {store.description}
          </p>
        )}

        <button
          type="button"
          onClick={() => navigate(`/store/${store._id}`)}
          className="w-full mt-2 py-2.5 rounded-xl bg-primary text-white text-xs font-black active:scale-[0.98] transition-transform"
        >
          زيارة المتجر
        </button>
      </div>
    </article>
  );
};

export default PointsStoreCard;
