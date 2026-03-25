import { memo } from 'react';
import { FileText, Image as ImageIcon, Trash2, Upload } from 'lucide-react';

const formatBytes = (bytes) => {
  if (!bytes || Number.isNaN(bytes)) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const FileUploadField = ({
  id,
  label,
  accept,
  onChange,
  helperText,
  error,
  file,
  previewUrl,
  uploadProgress = 0,
  isUploading = false,
  onClear,
  disabled = false,
}) => {
  const selectedName = file?.name || '';
  const selectedSize = file?.size ? formatBytes(file.size) : '';
  const shouldShowImagePreview =
    Boolean(previewUrl) && (file?.type?.startsWith('image/') || String(accept || '').includes('image'));
  const shouldShowPdfBadge = file?.type === 'application/pdf';

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm text-zinc-300">
        {label}
      </label>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        }`}
      >
        <Upload className="h-4 w-4" />
        <span className="truncate">{selectedName || 'Choose file'}</span>
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onChange}
        disabled={disabled}
      />
      {selectedName ? (
        <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm text-zinc-200">{selectedName}</p>
            {selectedSize ? <p className="text-xs text-zinc-500">{selectedSize}</p> : null}
          </div>
          {typeof onClear === 'function' ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:text-zinc-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
      {shouldShowImagePreview ? (
        <div className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
          <img src={previewUrl} alt="Selected file preview" className="h-28 w-full object-cover" />
        </div>
      ) : null}
      {shouldShowPdfBadge ? (
        <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-300">
          <FileText className="h-3.5 w-3.5" />
          PDF ready for upload
        </div>
      ) : null}
      {!shouldShowPdfBadge && !shouldShowImagePreview && selectedName ? (
        <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-300">
          <ImageIcon className="h-3.5 w-3.5" />
          File ready for upload
        </div>
      ) : null}
      {isUploading || uploadProgress > 0 ? (
        <div className="space-y-1 pt-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-200 transition-all duration-200"
              style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">
            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload complete'}
          </p>
        </div>
      ) : null}
      {helperText ? <p className="text-xs text-zinc-500">{helperText}</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
};

export default memo(FileUploadField);
