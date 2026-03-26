import { memo } from 'react';
import { motion as Motion } from 'framer-motion';
import Card from '../ui/Card';

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const ProfessionalSummary = ({ summary }) => {
  if (!summary) return null;

  return (
    <Motion.div variants={itemAnimation} className="w-full mb-8">
      <h2 className="text-sm font-semibold text-zinc-100 mb-3 uppercase tracking-wider">Professional Summary</h2>
      <Card hoverEffect={false} className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-lg w-full">
        <p className="text-sm text-zinc-400 leading-relaxed">
          {summary}
        </p>
      </Card>
    </Motion.div>
  );
};

export default memo(ProfessionalSummary);
