import { memo } from 'react';
import { FileText, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { HERO_CTA_CONFIG } from './hero.constants';
import useDefaultResumeStore from '../../store/useDefaultResumeStore';
import {
  buildResumeDownloadUrl,
  getResumeDownloadFileName,
  triggerResumeDownload,
} from '../../lib/resumeDownload';

const CTAButtons = () => {
  const navigate = useNavigate();
  const defaultResume = useDefaultResumeStore((state) => state.defaultResume);
  const isLoadingResume = useDefaultResumeStore((state) => state.isLoading);
  const hasFetchedResume = useDefaultResumeStore((state) => state.hasFetched);
  const resumeError = useDefaultResumeStore((state) => state.error);

  const resumeUrl = buildResumeDownloadUrl(defaultResume?.downloadUrl || defaultResume?.fileUrl || '');
  const hasDownloadableResume = Boolean(resumeUrl);
  const shouldHideDownloadButton =
    hasFetchedResume && !isLoadingResume && !hasDownloadableResume && !resumeError;
  const downloadLabel = hasDownloadableResume
    ? HERO_CTA_CONFIG.secondary.label
    : isLoadingResume
    ? 'Loading Resume...'
    : 'Resume Unavailable';

  const handleDownloadResume = () => {
    if (!hasDownloadableResume) {
      return;
    }

    triggerResumeDownload({
      url: resumeUrl,
      fileName: getResumeDownloadFileName(defaultResume),
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start w-full sm:w-auto mt-4 sm:mt-0">
      <Button
        variant="primary"
        className="w-full gap-2 sm:w-auto px-8 py-3.5 text-[15px] sm:text-base font-bold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300"
        onClick={() => navigate('/contact')}
      >
        <UserPlus className="h-4 w-4" />
        {HERO_CTA_CONFIG.primary.label}
      </Button>
      {!shouldHideDownloadButton ? (
        <Button
          variant="secondary"
          className={`w-full gap-2 sm:w-auto px-8 py-3.5 text-[15px] sm:text-base font-bold border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all duration-300 ${
            !hasDownloadableResume ? 'cursor-not-allowed opacity-65 hover:bg-zinc-800' : ''
          }`}
          onClick={handleDownloadResume}
          disabled={!hasDownloadableResume}
          title={!hasDownloadableResume ? 'No default resume available right now' : undefined}
        >
          <FileText className="h-4 w-4" />
          {downloadLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default memo(CTAButtons);
