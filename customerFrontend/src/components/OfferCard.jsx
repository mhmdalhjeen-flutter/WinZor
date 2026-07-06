import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, MapPin, ImageOff, ShoppingCart, Eye, Check, Loader2, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OfferPriceDisplay from './OfferPriceDisplay';
import { formatOfferBadge } from '../utils/offerPricing';
import api from '../api/axios';
import { useVerificationGate } from '../context/VerificationGateContext';
import { queryClient, queryKeys } from '../lib/queryClient';
import { CART_VERIFICATION } from '../utils/verificationGateConfig';

export const getOfferBadge = (offer) => {
  if (offer?.pricing?.badge) {
    const m = offer.pricing.badge.match(/(\d+)%/);
    if (m) return `${m[1]}%`;
    if (offer.pricing.badge === '1+1') return '1+1';
    return offer.pricing.badge.length <= 8 ? offer.pricing.badge : '\u0639\u0631\u0636';
  }
  return formatOfferBadge(offer);
};

const OfferCard = ({ offer, favorited = false, onToggleFavorite }) => {
  const navigate = useNavigate();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const goDetails = () => navigate(`/offer/${offer._id}`);

  const handleFav = (e) => {
    e.stopPropagation();
    onToggleFavorite?.(offer);
  };

  const performAdd = async () => {
    setAdding(true);
    try {
      await api.post('/cart/add', { itemId: offer._id, itemType: 'offer', quantity: 1 });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      handleApiVerificationError(err, performAdd, CART_VERIFICATION);
    } finally {
      setAdding(false);
    }
  };

  const addToCart = (e) => {
    e.stopPropagation();
    if (adding || added) return;
    runWithVerification(performAdd, CART_VERIFICATION);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={goDetails}
      className="bg-white/5 border border-white/10 rounded-[28px] overflow-hidden backdrop-blur-md group cursor-pointer flex flex-col"
    >
      <div className="relative aspect-video bg-white/10">
        {offer.image ? (
          <img src={offer.image} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={offer.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <ImageOff size={28} />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
          {getOfferBadge(offer)}
        </div>
        {onToggleFavorite && (
          <button
            onClick={handleFav}
            aria-label="إضافة للمفضّلة"
            className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              favorited ? 'bg-red-500/90 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'
            }`}
          >
            <Heart size={15} fill={favorited ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-2 flex flex-col flex-1">
        <h4 className="text-white text-sm font-black line-clamp-1">{offer.title}</h4>

        <div className="flex justify-between items-center">
          <span className="text-[10px] text-white/40 font-bold flex items-center gap-1">
            <Tag size={11} /> {offer.store?.name || 'متجر'}
          </span>
          {offer.store?.region && (
            <span className="flex items-center gap-1 text-white/40 text-[10px] font-bold">
              <MapPin size={11} /> {offer.store.region}
            </span>
          )}
        </div>

        <OfferPriceDisplay
          offer={offer}
          oldClassName="text-white/40 font-bold text-sm line-through"
          newClassName="text-primary-light font-black text-lg"
          badgeClassName="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-white/80"
        />

        <div className="flex gap-2 pt-1 mt-auto">
          <button
            onClick={addToCart}
            className="flex-1 bg-primary/90 hover:bg-primary text-white text-[11px] font-black py-2 rounded-xl flex items-center justify-center gap-1 transition-all"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : added ? <Check size={14} /> : <ShoppingCart size={14} />}
            {added ? 'تمت الإضافة' : 'للسلة'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goDetails(); }}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black py-2 rounded-xl flex items-center justify-center gap-1 transition-all"
          >
            <Eye size={14} /> التفاصيل
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OfferCard;
