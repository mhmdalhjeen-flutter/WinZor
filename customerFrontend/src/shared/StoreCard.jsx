import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StoreCard = ({ store, membershipStatus }) => {
  const navigate = useNavigate();
  const logo = store.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name || 'S')}&background=6366f1&color=fff`;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/store/${store._id}`)}
      className="w-[160px] shrink-0 bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden text-right"
    >
      <div className="h-24 bg-gray-50">
        <img src={logo} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
      </div>
      <div className="p-3 space-y-1">
        <h4 className="font-black text-gray-900 text-xs truncate">{store.name}</h4>
        <p className="text-[10px] text-gray-400 flex items-center gap-1 font-bold truncate">
          <MapPin size={10} /> {store.subRegion || store.region}
        </p>
        <div className="flex items-center justify-between text-[10px] font-black">
          <span className="flex items-center gap-0.5 text-amber-500">
            <Star size={10} fill="currentColor" /> {(store.ratingAvg || 0).toFixed(1)}
          </span>
          <span className="flex items-center gap-0.5 text-gray-400">
            <Users size={10} /> {store.customersCount || 0}
          </span>
        </div>
        {membershipStatus === 'pending' && (
          <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-block">قيد الانتظار</span>
        )}
        {membershipStatus === 'member' && (
          <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-block">عضو</span>
        )}
      </div>
    </motion.button>
  );
};

export default StoreCard;
