import { memo } from 'react';
import { motion as Motion } from 'framer-motion';

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const SKILLS_DATA = {
  "Programming": ["HTML", "CSS", "JavaScript", "TypeScript", "Python"],
  "Frameworks": ["React", "Node", "Express", "Django"],
  "Databases": ["MongoDB", "MySQL", "PostgreSQL"],
  "Tools": ["Git", "GitHub", "VS Code", "Linux"],
  "AI": ["Langchain", "RAG", "OpenAI", "Gemini"]
};

const SkillsTechStack = () => {
  return (
    <Motion.div variants={itemAnimation} className="w-full mb-8">
      <h2 className="text-sm font-semibold text-zinc-100 mb-3 uppercase tracking-wider">Skills & Tech Stack</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(SKILLS_DATA).map(([category, skills]) => (
          <div key={category} className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-md">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="text-sm text-zinc-300 bg-zinc-900/50 px-2 py-1 rounded inline-block border border-zinc-800/50">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Motion.div>
  );
};

export default memo(SkillsTechStack);
