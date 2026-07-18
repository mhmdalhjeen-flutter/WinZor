import React from 'react';
import PwaUpdateBanner from './PwaUpdateBanner';
import usePwaUpdate from '../../hooks/usePwaUpdate';

/** PWA update prompt (install card lives in PwaInstallProvider). */
export default function PwaHost() {
  const { updateReady } = usePwaUpdate();

  if (!updateReady) return null;
  return <PwaUpdateBanner />;
}
