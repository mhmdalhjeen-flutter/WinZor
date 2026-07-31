import React from 'react';
import LegalPageLayout, { LegalSection } from '../components/legal/LegalPageLayout';
import { DEFAULT_TERMS } from '../content/defaultLegal';

export default function TermsOfService() {
  return (
    <LegalPageLayout
      title="الشروط والأحكام"
      subtitle="شروط استخدام منصة Win Gold"
      activePath="/terms"
    >
      <LegalSection body={DEFAULT_TERMS} />
    </LegalPageLayout>
  );
}
