import React from 'react';

const Card = ({ children, className = '', hoverEffect = true }) => {
  return (
    <div className={`bg-dark-card border border-dark-hover rounded-xl shadow-lg shadow-black/30 transition-all duration-300 ease-in-out ${hoverEffect ? 'hover:bg-dark-hover hover:border-text-muted/30' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
