import React from 'react';

/** بديل لـ window.confirm داخل الموقع */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      dir="rtl"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-xl text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-black text-gray-900">{title}</h3>
        {message && <p className="mt-2 text-sm font-bold text-gray-600">{message}</p>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-gray-200 font-black text-sm text-gray-600"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-2xl font-black text-sm text-white ${
              danger ? 'bg-red-500' : 'bg-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
