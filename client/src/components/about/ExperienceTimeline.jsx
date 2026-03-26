import { memo } from 'react';
import { motion as Motion } from 'framer-motion';
import Card from '../ui/Card';

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const EXPERIENCE_DATA = {
  company: "FlashSpace",
  role: "Full Stack Intern",
  points: [
    "Built reusable UI components across 5+ modules",
    "Delivered scalable backend (MVC) and frontend features",
    "Optimized API performance by 20%",
    "Completed 30+ development tasks"
  ]
};

const ExperienceTimeline = () => {
  return (
    <Motion.div variants={itemAnimation} className="w-full mb-8">
      <h2 className="text-sm font-semibold text-zinc-100 mb-3 uppercase tracking-wider">Experience</h2>
      <Card hoverEffect={false} className="bg-zinc-950/75 border border-zinc-800 p-4">
        <div className="mb-3">
          <h3 className="text-base font-bold text-white">{EXPERIENCE_DATA.company}</h3>
          <p className="text-sm font-medium text-zinc-300">{EXPERIENCE_DATA.role}</p>
        </div>
        <ul className="space-y-2">
          {EXPERIENCE_DATA.points.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-zinc-400">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
              <span className="leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </Card>
    </Motion.div>
  );
};

export default memo(ExperienceTimeline);
