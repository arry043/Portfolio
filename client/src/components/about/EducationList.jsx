import { memo } from 'react';
import { motion as Motion } from 'framer-motion';

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const EDUCATION_DATA = [
  {
    degree: "B.Tech Computer Science",
    college: "CCS University",
    cgpa: "8.67"
  },
  {
    degree: "Diploma Computer Science",
    college: "Govt Polytechnic",
    percentage: "77.11%"
  }
];

const EducationList = () => {
  return (
    <Motion.div variants={itemAnimation} className="w-full mb-8">
      <h2 className="text-sm font-semibold text-zinc-100 mb-3 uppercase tracking-wider">Education</h2>
      <div className="border-l border-zinc-800 pl-4 space-y-4 py-1">
        {EDUCATION_DATA.map((edu, index) => (
          <div key={index} className="relative">
            <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-zinc-500 border-2 border-[#020617]" />
            <h3 className="text-sm font-semibold text-white">{edu.degree}</h3>
            <p className="text-sm text-zinc-400 mt-1">{edu.college}</p>
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              {edu.cgpa ? `CGPA: ${edu.cgpa}` : `Score: ${edu.percentage}`}
            </p>
          </div>
        ))}
      </div>
    </Motion.div>
  );
};

export default memo(EducationList);
