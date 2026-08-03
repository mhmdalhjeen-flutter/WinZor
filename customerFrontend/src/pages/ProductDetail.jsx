import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, MessageCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorState from '../shared/ErrorState';
import { useToast } from '../shared/Toast';
import { logActivity } from '../utils/activity';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useAuth } from '../context/AuthContext';
import { queryClient, queryKeys } from '../lib/queryClient';
import { CART_VERIFICATION } from '../utils/verificationGateConfig';
import { addItemToCart, updateCartItemQty } from '../utils/cartActions';
import { findCartRow } from '../utils/cartHelpers';
import useCartSummary from '../hooks/useCartSummary';
import ItemPurchaseControls from '../components/purchase/ItemPurchaseControls';
import { resolveProductImage } from '../utils/mediaUrl';
import { formatPriceWithUnit } from '../utils/currency';
import { recordRecentlyViewed } from '../utils/recentlyViewed';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const { isAuth } = useAuth();
  const { data: cartStats } = useCartSummary();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        recordRecentlyViewed({
          type: 'product',
          id: data.product?._id,
          title: data.product?.name || data.product?.title,
          image: resolveProductImage(data.product),
          price: formatPriceWithUnit(data.product?.price, data.product?.currency, data.product?.priceUnit),
        });
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

  const performAdd = async (payload) => {
    setAdding(true);
    try {
      await addItemToCart({ item: product, itemType: 'product', isAuth, ...payload });
      toast('تمت إضافة العنصر إلى السلة.', 'success');
    } catch (err) {
      if (handleApiVerificationError(err, () => performAdd(payload), CART_VERIFICATION)) return;
      toast(err.response?.data?.message || 'تعذّر الإضافة', 'error');
    } finally {
      setAdding(false);
    }
  };

  const performUpdate = async (payload) => {
    setAdding(true);
    try {
      await updateCartItemQty({ itemId: product._id, itemType: 'product', isAuth, ...payload });
    } catch (err) {
      if (handleApiVerificationError(err, () => performUpdate(payload), CART_VERIFICATION)) return;
      toast(err.response?.data?.message || 'تعذّر التحديث', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handlePurchaseAdd = (payload) => {
    if (adding || unavailable) return;
    if (!isAuth) {
      performAdd(payload);
      return;
    }
    runWithVerification(() => performAdd(payload), CART_VERIFICATION);
  };

  const handlePurchaseUpdate = (payload) => {
    if (adding || unavailable) return;
    if (!isAuth) {
      performUpdate(payload);
      return;
    }
    runWithVerification(() => performUpdate(payload), CART_VERIFICATION);
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
  if (error || !product) return <ErrorState message={error || 'العنصر غير موجود'} />;

  const store = product.store;
  const productImageSrc = resolveProductImage(product, { width: 600 });
  const unavailable = product.isActive === false;
  const qtyRow = findCartRow(cartStats, product._id, 'product', 'quantity');
  const priceRow = findCartRow(cartStats, product._id, 'product', 'price');

  return (
    <div className="space-y-6 pb-24 text-right" dir="rtl">
      <div className="relative h-64 bg-gray-100 rounded-b-[32px] overflow-hidden">
        {productImageSrc ? (
          <img
            src={productImageSrc}
            alt=""
            className="w-full h-full object-cover"
            width={600}
            height={400}
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">بدون صورة</div>
        )}
        <button type="button" onClick={() => navigate(-1)} className="absolute top-4 right-4 bg-white/30 backdrop-blur p-2 rounded-xl text-white">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="px-4 space-y-4">
        <h1 className="text-2xl font-black text-gray-900">{product.name}</h1>
        <p className="text-2xl font-black text-primary">{formatPriceWithUnit(product.price, product.currency, product.priceUnit)}</p>
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

        {unavailable && (
          <p className="text-sm font-bold text-slate-500 bg-slate-100 p-3 rounded-2xl text-center">غير متوفر حالياً</p>
        )}

        <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
          {!unavailable && (
            <ItemPurchaseControls
              item={product}
              itemType="product"
              currency={product.currency}
              compact={false}
              busy={adding}
              currentQty={qtyRow?.quantity || 0}
              currentAmount={priceRow?.requestedAmount ?? priceRow?.lineTotal ?? 0}
              onAdd={handlePurchaseAdd}
              onUpdate={handlePurchaseUpdate}
            />
          )}
          <button type="button" onClick={contact} className="w-full border-2 border-gray-100 rounded-2xl py-3 flex items-center justify-center gap-2 font-bold text-gray-700">
            <MessageCircle size={20} />
            تواصل مع المتجر
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
