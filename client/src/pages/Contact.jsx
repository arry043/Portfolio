import { memo } from 'react';
import ContactSection from '../components/sections/ContactSection';
import PageTransition from '../components/layout/PageTransition';

const ContactPage = () => {
  return (
    <PageTransition className="pt-16">
      <ContactSection />
    </PageTransition>
  );
};

export default memo(ContactPage);
