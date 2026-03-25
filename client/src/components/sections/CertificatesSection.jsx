import { memo, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';
import SectionHeader from '../common/SectionHeader';
import ImageWithSkeleton from '../common/ImageWithSkeleton';
import SectionSkeleton from '../common/SectionSkeleton';
import EmptyState from '../common/EmptyState';
import { useCertificatesQuery } from '../../hooks/usePortfolioApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import { useTrackSectionView } from '../../hooks/useTrackEvent';
import { formatMonthYear } from '../../utils/date';

const CertificatesSection = () => {
  const certificatesQuery = useCertificatesQuery();
  const toast = useToast();
  useTrackSectionView('certificates');

  useEffect(() => {
    if (certificatesQuery.isError) {
      toast.error(getErrorMessage(certificatesQuery.error), 'Certificates Fetch Failed');
    }
  }, [certificatesQuery.error, certificatesQuery.isError, toast]);

  const items = certificatesQuery.data?.items || [];

  return (
    <SectionWrapper id="certificates" bgVariant="secondary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="Certificates"
            title="Verified Learning Milestones"
            description="Certifications are loaded dynamically from backend records with preview cards."
          />

          {certificatesQuery.isLoading ? (
            <SectionSkeleton cardCount={3} />
          ) : items.length === 0 ? (
            <EmptyState
              message="No Certificates Found!"
              description="Certificates will appear here once records are available."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((certificate) => (
                // Keep date fallback for older records that only contain issuedDate.
                <Motion.div
                  key={certificate._id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Card className="overflow-hidden border-zinc-800 bg-zinc-950/80" hoverEffect>
                    <ImageWithSkeleton
                      src={certificate.image}
                      alt={certificate.title}
                      className="h-36 w-full"
                    />
                    <div className="space-y-1 p-3">
                      <h3 className="truncate text-sm font-semibold text-zinc-100" title={certificate.title}>
                        {certificate.title}
                      </h3>
                      <p className="truncate text-sm text-zinc-400" title={certificate.issuer}>
                        {certificate.issuer}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatMonthYear(certificate.issueDate || certificate.issuedDate)}
                      </p>
                    </div>
                  </Card>
                </Motion.div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(CertificatesSection);
