import React, { useState, memo } from 'react';
import { ShoppingCart, Eye, Check, Loader2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/currency';
import api from '../api/axios';
import { useToast } from './Toast';
import { useVerificationGate } from '../context/VerificationGateContext';
import { queryClient, queryKeys } from '../lib/queryClient';
import { resolveProductImage, cloudinarySrcSet } from '../utils/mediaUrl';
import { CART_VERIFICATION } from '../utils/verificationGateConfig';

const ProductCard = ({ product, storeId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const performAdd = async () => {
    setAdding(true);
    try {
      await api.post('/cart/add', { itemId: product._id, itemType: 'product', quantity: 1 });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      setAdded(true);
      toast('تمت الإضافة للسلة', 'success');
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      if (handleApiVerificationError(err, performAdd, CART_VERIFICATION)) return;
      toast(err.response?.data?.message || 'تعذّر الإضافة', 'error');
    } finally {
      setAdding(false);
    }
  };

  const addToCart = (e) => {
    e.stopPropagation();
    if (adding || added) return;
    runWithVerification(performAdd, CART_VERIFICATION);
  };

  const imageSrc = resolveProductImage(product, { width: 300 });
  const imageSrcSet = cloudinarySrcSet(product?.image, [300, 600]);

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm cursor-pointer flex flex-col transition-transform duration-200 hover:-translate-y-[3px]"
    >
      <div className="aspect-square bg-gray-50 relative">
        {imageSrc ? (
          <img
            src={imageSrc}
            srcSet={imageSrcSet}
            sizes="300px"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">بدون صورة</div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-2">
        <h4 className="font-black text-sm text-gray-900 line-clamp-2">{product.name}</h4>
        <p className="text-primary font-black text-sm">{formatPrice(product.price, product.currency)}</p>
        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
          <Star size={10} fill="currentColor" /> {(product.ratingAvg || 0).toFixed(1)}
        </div>
        <div className="flex gap-2 mt-auto pt-1">
          <button
            type="button"
            onClick={addToCart}
            disabled={adding}
            className="flex-1 bg-primary text-white py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1"
          >
            {adding ? <Loader2 size={12} className="animate-spin" /> : added ? <Check size={12} /> : <ShoppingCart size={12} />}
            {added ? 'تم' : 'سلة'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${product._id}`); }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductCard);
