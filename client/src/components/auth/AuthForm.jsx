import React from 'react';
import Card from '../ui/Card';

const AuthForm = ({ title, subtitle, children, onSubmit }) => {
  return (
    <Card className="w-full max-w-sm mx-auto p-8 space-y-7 relative z-10" hoverEffect={false}>
      <div className="text-center space-y-1.5 border-b border-zinc-800/50 pb-5">
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
      </form>
    </Card>
  );
};

export default AuthForm;
