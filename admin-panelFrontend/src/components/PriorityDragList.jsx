import React, { useEffect, useState } from 'react';
import { GripVertical, Loader2 } from 'lucide-react';

export default function PriorityDragList({
  items = [],
  onReorder,
  getItemId = (item) => item._id,
  renderItem,
  saving = false,
  emptyMessage = 'لا توجد عناصر',
}) {
  const [localItems, setLocalItems] = useState(items);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const commitReorder = async (nextItems) => {
    setLocalItems(nextItems);
    await onReorder(nextItems.map(getItemId));
  };

  const handleDrop = (targetIndex) => {
    if (dragIndex == null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const next = [...localItems];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    setOverIndex(null);
    commitReorder(next);
  };

  if (!localItems.length) {
    return (
      <p className="text-sm font-bold text-gray-400 py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-2 relative">
      {saving && (
        <div className="absolute inset-0 z-10 bg-white/60 rounded-2xl flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={22} />
        </div>
      )}

      {localItems.map((item, index) => (
        <div
          key={getItemId(item)}
          draggable={!saving}
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverIndex(index);
          }}
          onDragLeave={() => {
            if (overIndex === index) setOverIndex(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(index);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={`flex items-center gap-3 p-3 rounded-2xl border bg-white transition-all cursor-grab active:cursor-grabbing ${
            dragIndex === index ? 'opacity-50 scale-[0.98]' : ''
          } ${
            overIndex === index && dragIndex !== index
              ? 'border-primary shadow-md ring-2 ring-primary/20'
              : 'border-gray-100 shadow-sm'
          }`}
        >
          <div className="flex flex-col items-center gap-0.5 shrink-0 text-gray-300">
            <GripVertical size={18} />
            <span className="text-[10px] font-black text-primary">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            {renderItem(item, index)}
          </div>
        </div>
      ))}
    </div>
  );
}
