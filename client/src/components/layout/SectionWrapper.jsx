import React from 'react';

const SectionWrapper = ({ children, id, className = '', bgVariant = 'primary' }) => {
  const bgColors = {
    primary: 'bg-dark-primary',
    secondary: 'bg-dark-secondary',
    card: 'bg-dark-card',
    hero: 'bg-gradient-to-b from-[#09090b] to-black',
  };

  return (
    <section 
      id={id} 
      className={`py-12 md:py-16 w-full ${bgColors[bgVariant] || bgColors.primary} transition-colors duration-300 ${className}`}
    >
      {children}
    </section>
  );
};

export default SectionWrapper;
