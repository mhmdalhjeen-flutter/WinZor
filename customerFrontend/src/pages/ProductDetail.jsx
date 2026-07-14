import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingCart, MessageCircle, Check, Loader2 } from 'lucide-react';
import api from '../api/axios';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorState from '../shared/ErrorState';
import { useToast } from '../shared/Toast';
import { logActivity } from '../utils/activity';
import { useVerificationGate } from '../context/VerificationGateContext';
import { queryClient, queryKeys } from '../lib/queryClient';
import { CART_VERIFICATION } from '../utils/verificationGateConfig';
import { resolveProductImage } from '../utils/mediaUrl';
import { formatPrice } from '../utils/currency';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        logActivity('view_product', {
          targetType: 'Product',
          targetId: data.product?._id,
          meta: {
            category: data.product?.category,
            region: data.product?.store?.region,
          },
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'تعذّر التحميل'))
      .finally(() => setLoading(false));
  }, [id]);

  const performAdd = async () => {
    setAdding(true);
    try {
      await api.post('/cart/add', { itemId: product._id, itemType: 'product', quantity: 1 });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      setAdded(true);
      toast('تمت الإضافة للسلة', 'success');
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      if (handleApiVerificationError(err, performAdd, CART_VERIFICATION)) return;
      toast(err.response?.data?.message || 'تعذّر الإضافة', 'error');
    } finally {
      setAdding(false);
    }
  };

  const addToCart = () => {
    if (adding || added) return;
    runWithVerification(performAdd, CART_VERIFICATION);
  };

  const contact = () => {
    const owner = product?.store?.owner;
    const ownerId = owner?._id || owner;
    if (!ownerId) { toast('لا يمكن التواصل', 'error'); return; }
    localStorage.setItem('chatContext', JSON.stringify({
      recipientId: ownerId,
      context: {
        itemId: product._id,
        itemType: 'Product',
        itemName: product.name,
        itemImage: resolveProductImage(product, { width: 300 }) || '',
      },
    }));
    navigate('/chat');
  };

  if (loading) return <LoadingSpinner />;
  if (error || !product) return <ErrorState message={error || 'المنتج غير موجود'} />;

  const store = product.store;
  const productImageSrc = resolveProductImage(product, { width: 800 });

  return (
    <div className="space-y-6 pb-24 text-right" dir="rtl">
      <div className="relative h-64 bg-gray-100 rounded-b-[32px] overflow-hidden">
        {productImageSrc ? (
          <img src={productImageSrc} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">بدون صورة</div>
        )}
        <button type="button" onClick={() => navigate(-1)} className="absolute top-4 right-4 bg-white/30 backdrop-blur p-2 rounded-xl text-white">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="px-4 space-y-4">
        <h1 className="text-2xl font-black text-gray-900">{product.name}</h1>
        <p className="text-2xl font-black text-primary">{formatPrice(product.price, product.currency)}</p>
        <StarRating targetType="product" targetId={product._id} ratingAvg={product.ratingAvg} ratingCount={product.ratingCount} />

        {product.description && (
          <p className="text-sm text-gray-600 bg-white p-4 rounded-2xl border border-gray-100">{product.description}</p>
        )}

        {store && (
          <button
            type="button"
            onClick={() => navigate(`/store/${store._id || store}`)}
            className="w-full bg-white p-4 rounded-2xl border border-gray-100 text-right font-black text-sm text-gray-800"
          >
            المتجر: {store.name || 'عرض المتجر'}
          </button>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={addToCart} disabled={adding} className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2">
            {adding ? <Loader2 className="animate-spin" /> : added ? <Check /> : <ShoppingCart />}
            {added ? 'تمت الإضافة' : 'إضافة للسلة'}
          </button>
          <button type="button" onClick={contact} className="flex-1 border-2 border-gray-100 rounded-2xl flex items-center justify-center">
            <MessageCircle size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
