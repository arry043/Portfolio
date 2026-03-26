import { memo } from 'react';
import { motion as Motion } from 'framer-motion';

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const AboutHeroIntro = () => {
  return (
    <Motion.div variants={itemAnimation} className="text-center mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
        Mohd Arif Ansari
      </h1>
      <p className="text-lg text-zinc-300 font-medium mt-1">Full Stack Developer</p>
      <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
        Building scalable products with AI integration
      </p>
    </Motion.div>
  );
};

export default memo(AboutHeroIntro);
