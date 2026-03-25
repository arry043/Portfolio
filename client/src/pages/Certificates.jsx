import { memo } from 'react';
import CertificatesSection from '../components/sections/CertificatesSection';
import PageTransition from '../components/layout/PageTransition';

const CertificatesPage = () => {
  return (
    <PageTransition className="pt-16">
      <CertificatesSection />
    </PageTransition>
  );
};

export default memo(CertificatesPage);
