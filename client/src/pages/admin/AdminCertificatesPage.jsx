import { memo, useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminTable from '../../components/admin/AdminTable';
import AdminFormModal from '../../components/admin/AdminFormModal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import FileUploadField from '../../components/admin/FileUploadField';
import Button from '../../components/ui/Button';
import { adminCertificateSchema } from '../../schemas/adminForms';
import {
  useAdminCertificatesQuery,
  useCreateAdminCertificateMutation,
  useDeleteAdminCertificateMutation,
  useUpdateAdminCertificateMutation,
} from '../../hooks/useAdminApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import SectionSkeleton from '../../components/common/SectionSkeleton';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const AdminCertificatesPage = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const certificatesQuery = useAdminCertificatesQuery();
  const createMutation = useCreateAdminCertificateMutation();
  const updateMutation = useUpdateAdminCertificateMutation();
  const deleteMutation = useDeleteAdminCertificateMutation();
  const toast = useToast();

  const form = useForm({
    resolver: zodResolver(adminCertificateSchema),
    defaultValues: {
      title: '',
      organization: '',
      issueDate: '',
      imageFile: undefined,
    },
  });
  const selectedImageFile = form.watch('imageFile');

  const resetPreview = useCallback(() => {
    setPreviewUrl((current) => {
      if (current?.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }

      return '';
    });
  }, []);

  useEffect(() => {
    return () => {
      resetPreview();
    };
  }, [resetPreview]);

  useEffect(() => {
    if (certificatesQuery.isError) {
      toast.error(getErrorMessage(certificatesQuery.error), 'Certificates Load Failed');
    }
  }, [certificatesQuery.error, certificatesQuery.isError, toast]);

  const items = certificatesQuery.data?.items || [];

  const resetModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setUploadProgress(0);
    setIsUploading(false);
    resetPreview();
    form.reset({ title: '', organization: '', issueDate: '', imageFile: undefined });
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setUploadProgress(0);
    setIsUploading(false);
    resetPreview();
    form.reset({ title: '', organization: '', issueDate: '', imageFile: undefined });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setUploadProgress(0);
    setIsUploading(false);
    resetPreview();
    form.reset({
      title: item.title || '',
      organization: item.organization || item.issuer || '',
      issueDate: item.issueDate || item.issuedDate
        ? new Date(item.issueDate || item.issuedDate).toISOString().slice(0, 10)
        : '',
      imageFile: undefined,
    });
    setModalOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const loadingToastId = toast.loading(editingItem ? 'Updating certificate...' : 'Creating certificate...');
    const shouldTrackUpload = Boolean(values.imageFile);

    try {
      if (!editingItem && !values.imageFile) {
        toast.update(loadingToastId, {
          type: 'warning',
          title: 'Missing Image',
          message: 'Please select a certificate image before creating.',
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
        organization: values.organization,
        issueDate: values.issueDate,
        imageFile: values.imageFile,
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
        title: editingItem ? 'Certificate Updated' : 'Certificate Added',
        message: 'Action completed successfully.',
        persistent: false,
      });
      resetModal();
    } catch (error) {
      toast.update(loadingToastId, {
        type: 'error',
        title: 'Certificate Action Failed',
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

    const loadingToastId = toast.loading('Deleting certificate...');
    try {
      await deleteMutation.mutateAsync(deletingItem._id);
      toast.update(loadingToastId, {
        type: 'success',
        title: 'Certificate Deleted',
        message: 'Certificate removed successfully.',
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
        <p className="text-sm text-zinc-400">Create, update, and delete certificate records.</p>
        <Button variant="primary" className="gap-1.5 px-3 py-1.5" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Certificate
        </Button>
      </div>

      {certificatesQuery.isLoading ? (
        <SectionSkeleton cardCount={3} />
      ) : (
        <AdminTable
          columns={[
            { key: 'title', header: 'Title' },
            {
              key: 'organization',
              header: 'Organization',
              render: (row) => row.organization || row.issuer || '-',
            },
            {
              key: 'issueDate',
              header: 'Issue Date',
              render: (row) =>
                row.issueDate || row.issuedDate
                  ? new Date(row.issueDate || row.issuedDate).toLocaleDateString()
                  : '-',
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
          emptyMessage="No Certificates Found!"
        />
      )}

      <AdminFormModal
        open={isModalOpen}
        title={editingItem ? 'Update Certificate' : 'Add Certificate'}
        onClose={resetModal}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label htmlFor="certificate-title" className="text-sm text-zinc-300">
              Title
            </label>
            <input
              id="certificate-title"
              type="text"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              {...form.register('title')}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-zinc-500">{form.formState.errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="certificate-organization" className="text-sm text-zinc-300">
              Organization
            </label>
            <input
              id="certificate-organization"
              type="text"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              {...form.register('organization')}
            />
            {form.formState.errors.organization ? (
              <p className="text-xs text-zinc-500">{form.formState.errors.organization.message}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="certificate-issued" className="text-sm text-zinc-300">
              Issued Date
            </label>
            <input
              id="certificate-issued"
              type="date"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              {...form.register('issueDate')}
            />
          </div>

          <FileUploadField
            id="certificate-file"
            label="Certificate Image"
            accept="image/*"
            file={selectedImageFile}
            previewUrl={previewUrl || editingItem?.image || ''}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            helperText={
              editingItem
                ? 'Upload a new image to replace the existing certificate image (max 5MB)'
                : 'JPG, PNG, or WEBP (max 5MB)'
            }
            onClear={() => {
              const input = document.getElementById('certificate-file');
              if (input) {
                input.value = '';
              }
              resetPreview();
              form.setValue('imageFile', undefined, { shouldValidate: true, shouldDirty: true });
            }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                resetPreview();
                form.setValue('imageFile', undefined, { shouldValidate: true });
                return;
              }

              if (!allowedImageTypes.has(file.type)) {
                toast.warning('Please select JPG, PNG, or WEBP image.', 'Invalid Image Type');
                form.setError('imageFile', {
                  type: 'manual',
                  message: 'Only JPG, PNG, or WEBP images are allowed',
                });
                event.target.value = '';
                return;
              }

              if (file.size > MAX_IMAGE_BYTES) {
                toast.warning('Image must be 5MB or less.', 'File Too Large');
                form.setError('imageFile', {
                  type: 'manual',
                  message: 'Image size must be 5MB or less',
                });
                event.target.value = '';
                return;
              }

              form.clearErrors('imageFile');
              form.setValue('imageFile', file, { shouldValidate: true, shouldDirty: true });
              setUploadProgress(0);
              setPreviewUrl((current) => {
                if (current?.startsWith('blob:')) {
                  URL.revokeObjectURL(current);
                }
                return URL.createObjectURL(file);
              });
            }}
            error={form.formState.errors.imageFile?.message}
          />

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={resetModal}>
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
                : 'Create'}
            </Button>
          </div>
        </form>
      </AdminFormModal>

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Delete Certificate"
        description="This action permanently removes the selected certificate."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeletingItem(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default memo(AdminCertificatesPage);
