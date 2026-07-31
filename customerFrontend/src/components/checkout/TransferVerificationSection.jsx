import React, { useRef, useState } from 'react';
import { Upload, ImagePlus, Loader2, X } from 'lucide-react';
import { uploadImage } from '../../utils/imageUpload';
import { useToast } from '../../shared/Toast';
import PalestinianPhoneInput from '../PalestinianPhoneInput';

export default function TransferVerificationSection({
  draft,
  onChange,
  errors = {},
}) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState(() => (
    draft.transferProofUrl || draft.transferProofPreview ? 'receipt' : 'manual'
  ));

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const preview = URL.createObjectURL(file);
    onChange({ transferProofPreview: preview });

    try {
      const url = await uploadImage(file);
      onChange({ transferProofUrl: url, transferProofPreview: preview });
      toast('تم رفع إيصال التحويل', 'success');
    } catch (err) {
      onChange({ transferProofUrl: '', transferProofPreview: '' });
      toast(err.message || 'تعذّر رفع الصورة', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const clearReceipt = () => {
    onChange({ transferProofUrl: '', transferProofPreview: '' });
  };

  return (
    <section className="transfer-verification" aria-labelledby="transfer-verification-title">
      <h4 id="transfer-verification-title" className="transfer-verification__title">
        إثبات التحويل
      </h4>
      <p className="transfer-verification__lead">
        ارفع صورة الإيصال أو أدخل بيانات التحويل يدوياً
      </p>

      <div className="transfer-verification__tabs">
        <button
          type="button"
          className={[
            'transfer-verification__tab',
            mode === 'receipt' && 'transfer-verification__tab--active',
          ].filter(Boolean).join(' ')}
          onClick={() => setMode('receipt')}
        >
          <ImagePlus size={16} />
          رفع الإيصال
        </button>
        <button
          type="button"
          className={[
            'transfer-verification__tab',
            mode === 'manual' && 'transfer-verification__tab--active',
          ].filter(Boolean).join(' ')}
          onClick={() => setMode('manual')}
        >
          <Upload size={16} />
          بيانات التحويل
        </button>
      </div>

      {mode === 'receipt' && (
        <div className="transfer-verification__receipt">
          {(draft.transferProofPreview || draft.transferProofUrl) ? (
            <div className="transfer-verification__preview">
              <img
                src={draft.transferProofPreview || draft.transferProofUrl}
                alt="إيصال التحويل"
              />
              <button
                type="button"
                className="transfer-verification__remove"
                onClick={clearReceipt}
                aria-label="حذف الإيصال"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="transfer-verification__upload"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <ImagePlus size={28} strokeWidth={1.5} />
              )}
              <span>{uploading ? 'جاري الرفع...' : 'اضغط لرفع صورة الإيصال'}</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFilePick}
          />
        </div>
      )}

      {mode === 'manual' && (
        <div className="transfer-verification__form">
          <label className="transfer-verification__label">
            <span>اسم المحول *</span>
            <input
              type="text"
              value={draft.transferSenderName}
              onChange={(e) => onChange({ transferSenderName: e.target.value })}
              placeholder="الاسم كما يظهر في التحويل"
              className={errors.senderName ? 'transfer-verification__input--error' : ''}
            />
            {errors.senderName && (
              <em className="transfer-verification__error">{errors.senderName}</em>
            )}
          </label>

          <label className="transfer-verification__label">
            <span>رقم التواصل *</span>
            <PalestinianPhoneInput
              value={draft.transferContactNumber}
              onValueChange={(val) => onChange({ transferContactNumber: val })}
              showHint={false}
            />
            {errors.contactNumber && (
              <em className="transfer-verification__error">{errors.contactNumber}</em>
            )}
          </label>

          <label className="transfer-verification__label">
            <span>رقم التحويل (إن وُجد)</span>
            <input
              type="text"
              value={draft.transferReferenceNumber}
              onChange={(e) => onChange({ transferReferenceNumber: e.target.value })}
              placeholder="رقم العملية أو المرجع"
              dir="ltr"
            />
          </label>

          <label className="transfer-verification__label">
            <span>ملاحظة إضافية</span>
            <textarea
              value={draft.transferNote}
              onChange={(e) => onChange({ transferNote: e.target.value })}
              placeholder="أي تفاصيل إضافية للمتجر..."
              rows={2}
            />
          </label>
        </div>
      )}

      {errors.general && (
        <p className="transfer-verification__general-error">{errors.general}</p>
      )}
    </section>
  );
}
