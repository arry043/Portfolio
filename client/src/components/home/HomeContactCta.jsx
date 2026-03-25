import { memo } from 'react';
import { ArrowUpRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';

const HomeContactCta = () => {
  return (
    <SectionWrapper id="contact-cta" bgVariant="secondary" className="py-10 sm:py-12">
      <Container>
        <Card className="border-zinc-800 bg-zinc-950/80 p-3 sm:p-4" hoverEffect={false}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Ready To Build Something Strong?</p>
              <p className="text-sm text-zinc-400">
                Let&apos;s discuss product goals, architecture, and delivery roadmap.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Projects
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
              >
                Contact
                <Mail className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      </Container>
    </SectionWrapper>
  );
};

export default memo(HomeContactCta);
