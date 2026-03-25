import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium text-sm rounded-md transition-all duration-300 ease-in-out px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-500/50";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 shadow-md shadow-black/20",
    secondary: "bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 shadow-md shadow-black/20",
    outline: "bg-transparent text-text-primary border border-dark-hover hover:bg-dark-hover",
    ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-dark-hover/50",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
