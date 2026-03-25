import { memo } from 'react';
import { Code2, Server, Sparkles } from 'lucide-react';
import { MODE_OPTIONS, getValidatedMode } from './hero.constants';

const MODE_ICONS = {
  fullstack: Code2,
  backend: Server,
  ai: Sparkles,
};

const ModeSwitcher = ({ mode, onModeChange }) => {
  const activeMode = getValidatedMode(mode);

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-black/55 p-1 backdrop-blur-sm">
      {MODE_OPTIONS.map((option) => {
        const Icon = MODE_ICONS[option.value];
        const isActive = option.value === activeMode;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onModeChange(getValidatedMode(option.value))}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors duration-200 ${
              isActive
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(ModeSwitcher);
