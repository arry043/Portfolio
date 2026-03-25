import { memo } from 'react';
import { motion as Motion } from 'framer-motion';

const PageTransition = ({ children, className = '' }) => {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </Motion.div>
  );
};

export default memo(PageTransition);
