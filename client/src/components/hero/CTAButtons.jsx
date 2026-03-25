import { memo } from 'react';
import { ArrowUpRight, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

const CTAButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-3 pt-3 sm:flex-row sm:justify-center lg:justify-start">
      <Button
        variant="primary"
        className="w-full gap-2 sm:w-auto"
        onClick={() => navigate('/projects')}
      >
        View Projects
        <ArrowUpRight className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        className="w-full gap-2 sm:w-auto"
        onClick={() => navigate('/contact')}
      >
        Contact Me
        <Mail className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default memo(CTAButtons);
