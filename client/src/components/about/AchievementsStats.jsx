import { memo } from 'react';
import { motion as Motion } from 'framer-motion';

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const ACHIEVEMENTS_DATA = [
  "200+ LeetCode",
  "250+ GFG (Rank 20)",
  "400+ Naukri problems",
  "GATE Qualified",
  "SIH Leader"
];

// Helper to split number/highlight and label
const parseAchievement = (text) => {
  const match = text.match(/^([\d+]+|GATE|SIH)\s+(.*)$/);
  if (match) {
    return { highlight: match[1], label: match[2] };
  }
  return { highlight: text, label: '' };
};

const AchievementsStats = () => {
  return (
    <Motion.div variants={itemAnimation} className="w-full mb-8">
      <h2 className="text-sm font-semibold text-zinc-100 mb-3 uppercase tracking-wider">Achievements & Stats</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACHIEVEMENTS_DATA.map((achievement, index) => {
          const { highlight, label } = parseAchievement(achievement);
          return (
            <div key={index} className="text-center border border-zinc-800 bg-zinc-950 p-3 rounded-md flex flex-col justify-center items-center">
              <span className="text-lg font-bold text-white block">{highlight}</span>
              {label && <span className="text-xs text-zinc-500 mt-1 block uppercase tracking-wide">{label}</span>}
            </div>
          );
        })}
      </div>
    </Motion.div>
  );
};

export default memo(AchievementsStats);
