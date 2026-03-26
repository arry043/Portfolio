import { memo } from 'react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import { useResumeQuery } from '../../hooks/usePortfolioApi';

const HomeFooter = () => {
  const { data } = useResumeQuery();
  const name = data?.item?.profile?.name || 'Mohd Arif Ansari';
  return (
    <SectionWrapper id="footer" bgVariant="secondary" className="py-6">
      <Container>
        <div className="flex flex-col items-center justify-between gap-1 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-zinc-500">
            {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <p className="text-sm text-zinc-600">Built with React, Tailwind, and modular architecture.</p>
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(HomeFooter);
