import { memo } from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ message, description, icon = Inbox, className = '' }) => {
  const IconComponent = icon;

  return (
    <div
      className={`flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/55 p-4 text-center ${className}`}
    >
      <span className="inline-flex rounded-md border border-zinc-800 bg-zinc-900 p-2">
        <IconComponent className="h-4 w-4 text-zinc-500" />
      </span>
      <p className="text-sm font-medium text-zinc-300">{message}</p>
      {description ? <p className="max-w-md text-sm text-zinc-500">{description}</p> : null}
    </div>
  );
};

export default memo(EmptyState);
