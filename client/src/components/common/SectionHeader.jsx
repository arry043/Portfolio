import { memo } from 'react';

const SectionHeader = ({ eyebrow, title, description, center = false }) => {
  return (
    <div className={`space-y-2 ${center ? 'text-center' : 'text-left'}`}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p>
      ) : null}
      <h2 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">{title}</h2>
      {description ? (
        <p className={`text-sm text-zinc-400 ${center ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
};

export default memo(SectionHeader);
