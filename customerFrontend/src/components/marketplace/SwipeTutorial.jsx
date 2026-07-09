import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { isTutorialDone, markTutorialDone } from '../../utils/offerViewerTutorial';

export default function SwipeTutorial({ onComplete }) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isTutorialDone()) {
      onComplete?.();
      return;
    }
    setVisible(true);
    const t1 = setTimeout(() => setAnimating(true), 400);
    const t2 = setTimeout(() => {
      markTutorialDone();
      setVisible(false);
      onComplete?.();
    }, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`offer-viewer-tutorial ${animating ? 'offer-viewer-tutorial--animate' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="offer-viewer-tutorial__content">
        <ChevronUp size={28} className="offer-viewer-tutorial__arrow" aria-hidden />
        <p className="offer-viewer-tutorial__text">اسحب للأعلى لرؤية عروض أكثر</p>
      </div>
    </div>
  );
}
