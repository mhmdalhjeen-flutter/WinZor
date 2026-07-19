import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GIFT_QUERY_PARAM,
  openGiftActivation,
  parseGiftCodeFromPayload,
} from '../../utils/giftActivationFlow';

/** Handles `?gift=CODE` deep links from gift-card QR scans. */
export default function GiftActivationHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuth } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const rawGift = searchParams.get(GIFT_QUERY_PARAM);
    if (!rawGift) return;

    const code = parseGiftCodeFromPayload(rawGift);
    if (!code) return;

    handled.current = true;
    const next = new URLSearchParams(searchParams);
    next.delete(GIFT_QUERY_PARAM);
    setSearchParams(next, { replace: true });

    openGiftActivation(navigate, isAuth, code);
  }, [searchParams, setSearchParams, navigate, isAuth]);

  return null;
}
