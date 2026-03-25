import { memo } from 'react';
import { X } from 'lucide-react';

const AdminFormModal = ({ open, title, onClose, children }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/65 p-3">
      <div className="w-full max-w-xl rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
          <p className="truncate text-sm font-semibold text-zinc-100">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-800 bg-zinc-900 p-1 text-zinc-400 hover:text-zinc-200"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-3">{children}</div>
      </div>
    </div>
  );
};

export default memo(AdminFormModal);
