import React from 'react';
import LegalPageLayout, { LegalSection } from '../components/legal/LegalPageLayout';
import { PRIVACY_SECTIONS } from '../content/defaultLegal';

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="سياسة الخصوصية"
      subtitle="كيف نجمع بياناتك ونستخدمها ونحميها"
      activePath="/privacy"
    >
      {PRIVACY_SECTIONS.map((section) => (
        <LegalSection key={section.title} title={section.title} body={section.body} />
      ))}
    </LegalPageLayout>
  );
}
