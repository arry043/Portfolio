import React from 'react';

const Input = ({ label, id, className = '', ...props }) => {
  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={id}
        className="w-full bg-dark-card border border-dark-hover text-text-primary text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all duration-300 placeholder-text-muted shadow-inner shadow-black/10"
        {...props}
      />
    </div>
  );
};

export default Input;
