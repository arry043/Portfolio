import { memo } from 'react';
import AdminFormModal from './AdminFormModal';

const ConfirmDialog = ({
  open,
  title = 'Confirm action',
  description = 'Are you sure?',
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
  loading = false,
}) => {
  return (
    <AdminFormModal open={open} title={title} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">{description}</p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-md border border-zinc-700 bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </AdminFormModal>
  );
};

export default memo(ConfirmDialog);
