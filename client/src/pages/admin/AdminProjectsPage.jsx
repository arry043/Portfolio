import { memo, useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminTable from '../../components/admin/AdminTable';
import AdminFormModal from '../../components/admin/AdminFormModal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import FileUploadField from '../../components/admin/FileUploadField';
import Button from '../../components/ui/Button';
import { adminProjectSchema } from '../../schemas/adminForms';
import {
  useAdminProjectsQuery,
  useCreateAdminProjectMutation,
  useDeleteAdminProjectMutation,
  useUpdateAdminProjectMutation,
} from '../../hooks/useAdminApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import SectionSkeleton from '../../components/common/SectionSkeleton';
import { parseLegacyProjectDate } from '../../utils/date';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const AdminProjectsPage = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const projectsQuery = useAdminProjectsQuery();
  const createMutation = useCreateAdminProjectMutation();
  const updateMutation = useUpdateAdminProjectMutation();
  const deleteMutation = useDeleteAdminProjectMutation();
  const toast = useToast();

  const form = useForm({
    resolver: zodResolver(adminProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'MERN',
      tags: '',
      github: '',
      live: '',
      imageFile: undefined,
      projectDate: '',
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
    if (projectsQuery.isError) {
      toast.error(getErrorMessage(projectsQuery.error), 'Projects Load Failed');
    }
  }, [projectsQuery.error, projectsQuery.isError, toast]);

  const items = projectsQuery.data?.items || [];

  const resetModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setUploadProgress(0);
    setIsUploading(false);
    resetPreview();
    form.reset({
      name: '',
      description: '',
      category: 'MERN',
      tags: '',
      github: '',
      live: '',
      imageFile: undefined,
      projectDate: '',
    });
  };

  const openCreateModal = () => {
    setEditingItem(null);
    resetModal();
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    const resolvedProjectDate = item.projectDate
      ? new Date(item.projectDate)
      : parseLegacyProjectDate(item.date);

    setEditingItem(item);
    setUploadProgress(0);
    setIsUploading(false);
    resetPreview();
    form.reset({
      name: item.title || '',
      description: item.description || '',
      category: item.category || 'MERN',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      github: item.github || '',
      live: item.live || '',
      imageFile: undefined,
      projectDate: resolvedProjectDate ? resolvedProjectDate.toISOString().slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const loadingToastId = toast.loading(editingItem ? 'Updating project...' : 'Creating project...');
    const shouldTrackUpload = Boolean(values.imageFile);

    try {
      if (!editingItem && !values.imageFile) {
        toast.update(loadingToastId, {
          type: 'warning',
          title: 'Missing Image',
          message: 'Please select a project image before creating.',
          persistent: false,
        });
        return;
      }

      if (shouldTrackUpload) {
        setIsUploading(true);
        setUploadProgress(1);
      }

      const payload = {
        name: values.name,
        description: values.description,
        category: values.category,
        tags: values.tags,
        github: values.github || '',
        live: values.live || '',
        imageFile: values.imageFile,
        projectDate: values.projectDate || '',
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
        title: editingItem ? 'Project Updated' : 'Project Created',
        message: 'Action completed successfully.',
        persistent: false,
      });
      resetModal();
    } catch (error) {
      toast.update(loadingToastId, {
        type: 'error',
        title: 'Project Action Failed',
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

    const loadingToastId = toast.loading('Deleting project...');
    try {
      await deleteMutation.mutateAsync(deletingItem._id);
      toast.update(loadingToastId, {
        type: 'success',
        title: 'Project Deleted',
        message: 'Project removed successfully.',
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
        <p className="text-sm text-zinc-400">Add, edit, and manage your project portfolio entries.</p>
        <Button variant="primary" className="gap-1.5 px-3 py-1.5" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {projectsQuery.isLoading ? (
        <SectionSkeleton cardCount={3} />
      ) : (
        <AdminTable
          columns={[
            {
              key: 'title',
              header: 'Name',
              render: (row) => (
                <p className="max-w-xs truncate" title={row.title}>
                  {row.title}
                </p>
              ),
            },
            { key: 'category', header: 'Category' },
            {
              key: 'projectDate',
              header: 'Date',
              render: (row) =>
                row.projectDate
                  ? new Date(row.projectDate).toLocaleDateString()
                  : row.date || '-',
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
          emptyMessage="No Projects Found!"
        />
      )}

      <AdminFormModal
        open={isModalOpen}
        title={editingItem ? 'Update Project' : 'Add Project'}
        onClose={resetModal}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="project-name" className="text-sm text-zinc-300">
                Name
              </label>
              <input
                id="project-name"
                type="text"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <p className="text-xs text-zinc-500">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="project-category" className="text-sm text-zinc-300">
                Category
              </label>
              <select
                id="project-category"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('category')}
              >
                <option value="MERN">MERN</option>
                <option value="Django">Django</option>
                <option value="AI">AI</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="project-description" className="text-sm text-zinc-300">
              Description
            </label>
            <textarea
              id="project-description"
              rows={4}
              className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              {...form.register('description')}
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-zinc-500">{form.formState.errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="project-tags" className="text-sm text-zinc-300">
                Tags (comma separated)
              </label>
              <input
                id="project-tags"
                type="text"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('tags')}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="project-date" className="text-sm text-zinc-300">
                Project Date
              </label>
              <input
                id="project-date"
                type="date"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('projectDate')}
              />
              {form.formState.errors.projectDate ? (
                <p className="text-xs text-zinc-500">{form.formState.errors.projectDate.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="project-github" className="text-sm text-zinc-300">
                GitHub URL
              </label>
              <input
                id="project-github"
                type="url"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('github')}
              />
              {form.formState.errors.github ? (
                <p className="text-xs text-zinc-500">{form.formState.errors.github.message}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="project-live" className="text-sm text-zinc-300">
                Live URL
              </label>
              <input
                id="project-live"
                type="url"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('live')}
              />
              {form.formState.errors.live ? (
                <p className="text-xs text-zinc-500">{form.formState.errors.live.message}</p>
              ) : null}
            </div>
          </div>

          <FileUploadField
            id="project-image"
            label="Project Image"
            accept="image/*"
            file={selectedImageFile}
            previewUrl={previewUrl || editingItem?.image || ''}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            helperText={
              editingItem
                ? 'Upload a new image only if you want to replace the current one (max 5MB)'
                : 'JPG, PNG, or WEBP (max 5MB)'
            }
            onClear={() => {
              const input = document.getElementById('project-image');
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
        title="Delete Project"
        description="This action permanently removes the selected project."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeletingItem(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default memo(AdminProjectsPage);
