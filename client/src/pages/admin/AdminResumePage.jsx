import { memo, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminTable from '../../components/admin/AdminTable';
import AdminFormModal from '../../components/admin/AdminFormModal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import FileUploadField from '../../components/admin/FileUploadField';
import Button from '../../components/ui/Button';
import { adminResumeSchema } from '../../schemas/adminForms';
import {
  useAdminResumesQuery,
  useCreateAdminResumeMutation,
  useDeleteAdminResumeMutation,
  useUpdateAdminResumeMutation,
} from '../../hooks/useAdminApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import SectionSkeleton from '../../components/common/SectionSkeleton';

const CATEGORY_OPTIONS = ['fullstack', 'backend', 'frontend', 'python', 'ai'];
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const AdminResumePage = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const resumesQuery = useAdminResumesQuery();
  const createMutation = useCreateAdminResumeMutation();
  const updateMutation = useUpdateAdminResumeMutation();
  const deleteMutation = useDeleteAdminResumeMutation();
  const toast = useToast();

  const form = useForm({
    resolver: zodResolver(adminResumeSchema),
    defaultValues: {
      title: '',
      category: 'fullstack',
      file: undefined,
    },
  });
  const selectedFile = form.watch('file');

  useEffect(() => {
    if (resumesQuery.isError) {
      toast.error(getErrorMessage(resumesQuery.error), 'Resumes Load Failed');
    }
  }, [resumesQuery.error, resumesQuery.isError, toast]);

  const items = resumesQuery.data?.items || [];

  const modalTitle = useMemo(
    () => (editingItem ? 'Update Resume' : 'Upload Resume'),
    [editingItem]
  );

  const openCreateModal = () => {
    setEditingItem(null);
    setUploadProgress(0);
    setIsUploading(false);
    form.reset({ title: '', category: 'fullstack', file: undefined });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setUploadProgress(0);
    setIsUploading(false);
    form.reset({
      title: item.title || '',
      category: item.category || 'fullstack',
      file: undefined,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setUploadProgress(0);
    setIsUploading(false);
    form.reset({ title: '', category: 'fullstack', file: undefined });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const loadingToastId = toast.loading(editingItem ? 'Updating resume...' : 'Uploading resume...');
    const shouldTrackUpload = Boolean(values.file);

    try {
      if (!editingItem && !values.file) {
        toast.update(loadingToastId, {
          type: 'warning',
          title: 'Missing PDF',
          message: 'Please select a PDF file before uploading.',
          persistent: false,
        });
        return;
      }

      if (shouldTrackUpload) {
        setIsUploading(true);
        setUploadProgress(1);
      }

      const payload = {
        title: values.title,
        category: values.category,
        file: values.file,
        ...(shouldTrackUpload
          ? {
              onUploadProgress: (event) => {
                if (!event?.total) {
                  return;
                }

                setUploadProgress(Math.round((event.loaded * 100) / event.total));
              },
            }
          : {}),
      };

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem._id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      if (shouldTrackUpload) {
        setUploadProgress(100);
      }

      toast.update(loadingToastId, {
        type: 'success',
        title: editingItem ? 'Resume Updated' : 'Resume Uploaded',
        message: 'Action completed successfully.',
        persistent: false,
      });
      closeModal();
    } catch (error) {
      toast.update(loadingToastId, {
        type: 'error',
        title: 'Resume Action Failed',
        message: getErrorMessage(error),
        persistent: false,
      });
    } finally {
      if (shouldTrackUpload) {
        setIsUploading(false);
      }
    }
  });

  const confirmDelete = async () => {
    if (!deletingItem) {
      return;
    }

    const loadingToastId = toast.loading('Deleting resume...');
    try {
      await deleteMutation.mutateAsync(deletingItem._id);
      toast.update(loadingToastId, {
        type: 'success',
        title: 'Resume Deleted',
        message: 'The resume record has been removed.',
        persistent: false,
      });
      setDeletingItem(null);
    } catch (error) {
      toast.update(loadingToastId, {
        type: 'error',
        title: 'Delete Failed',
        message: getErrorMessage(error),
        persistent: false,
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-zinc-400">Upload and manage categorized resumes (PDF only).</p>
        <Button variant="primary" className="gap-1.5 px-3 py-1.5" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Resume
        </Button>
      </div>

      {resumesQuery.isLoading ? (
        <SectionSkeleton cardCount={3} />
      ) : (
        <AdminTable
          columns={[
            { key: 'title', header: 'Title' },
            { key: 'category', header: 'Category' },
            {
              key: 'fileUrl',
              header: 'File',
              render: (row) => (
                <a
                  href={row.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-zinc-300 underline-offset-4 hover:text-zinc-100 hover:underline"
                >
                  Open File
                </a>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(row)}
                    className="rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingItem(row)}
                    className="rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
          rows={items}
          emptyMessage="No resumes uploaded yet."
        />
      )}

      <AdminFormModal open={isModalOpen} title={modalTitle} onClose={closeModal}>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label htmlFor="resume-title" className="text-sm text-zinc-300">
              Title
            </label>
            <input
              id="resume-title"
              type="text"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              {...form.register('title')}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-zinc-500">{form.formState.errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="resume-category" className="text-sm text-zinc-300">
              Category
            </label>
            <select
              id="resume-category"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              {...form.register('category')}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <FileUploadField
            id="resume-file"
            label="Resume File"
            accept="application/pdf"
            file={selectedFile}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            helperText={
              editingItem
                ? 'Upload a new PDF only if you want to replace the current resume (max 5MB)'
                : 'PDF only (max 5MB)'
            }
            onClear={() => {
              const input = document.getElementById('resume-file');
              if (input) {
                input.value = '';
              }
              form.setValue('file', undefined, { shouldValidate: true, shouldDirty: true });
            }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                form.setValue('file', undefined, { shouldValidate: true });
                return;
              }

              if (file.type !== 'application/pdf') {
                toast.warning('Please select a valid PDF file.', 'Invalid Resume Type');
                form.setError('file', { type: 'manual', message: 'Only PDF files are allowed' });
                event.target.value = '';
                return;
              }

              if (file.size > MAX_RESUME_BYTES) {
                toast.warning('Resume PDF must be 5MB or less.', 'File Too Large');
                form.setError('file', { type: 'manual', message: 'PDF size must be 5MB or less' });
                event.target.value = '';
                return;
              }

              form.clearErrors('file');
              form.setValue('file', file, { shouldValidate: true, shouldDirty: true });
              setUploadProgress(0);
            }}
            error={form.formState.errors.file?.message}
          />

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingItem
                ? 'Update'
                : 'Upload'}
            </Button>
          </div>
        </form>
      </AdminFormModal>

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Delete Resume"
        description="This action permanently removes the selected resume."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeletingItem(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default memo(AdminResumePage);
