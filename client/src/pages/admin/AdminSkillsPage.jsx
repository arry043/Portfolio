import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminTable from '../../components/admin/AdminTable';
import AdminFormModal from '../../components/admin/AdminFormModal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import FileUploadField from '../../components/admin/FileUploadField';
import Button from '../../components/ui/Button';
import { adminSkillSchema } from '../../schemas/adminForms';
import {
  useAdminSkillsQuery,
  useCreateAdminSkillMutation,
  useDeleteAdminSkillMutation,
  useUpdateAdminSkillMutation,
} from '../../hooks/useAdminApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import SectionSkeleton from '../../components/common/SectionSkeleton';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const AdminSkillsPage = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const skillsQuery = useAdminSkillsQuery();
  const createMutation = useCreateAdminSkillMutation();
  const updateMutation = useUpdateAdminSkillMutation();
  const deleteMutation = useDeleteAdminSkillMutation();
  const toast = useToast();

  const form = useForm({
    resolver: zodResolver(adminSkillSchema),
    defaultValues: {
      skill: '',
      percentage: 50,
      category: '',
      displayOrder: 0,
      featured: true,
      isActive: true,
      logoFile: undefined,
    },
  });
  const selectedLogoFile = form.watch('logoFile');

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
    if (skillsQuery.isError) {
      toast.error(getErrorMessage(skillsQuery.error), 'Skills Load Failed');
    }
  }, [skillsQuery.error, skillsQuery.isError, toast]);

  const allItems = skillsQuery.data?.items || [];

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return allItems;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return allItems.filter(
      (item) =>
        item.skill?.toLowerCase().includes(lowerSearch) ||
        item.category?.toLowerCase().includes(lowerSearch)
    );
  }, [allItems, searchTerm]);

  const resetModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setUploadProgress(0);
    setIsUploading(false);
    resetPreview();
    form.reset({
      skill: '',
      percentage: 50,
      category: '',
      displayOrder: 0,
      featured: true,
      isActive: true,
      logoFile: undefined,
    });
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setUploadProgress(0);
    setIsUploading(false);
    resetPreview();
    form.reset({
      skill: '',
      percentage: 50,
      category: '',
      displayOrder: 0,
      featured: true,
      isActive: true,
      logoFile: undefined,
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setUploadProgress(0);
    setIsUploading(false);
    resetPreview();
    form.reset({
      skill: item.skill || '',
      percentage: item.percentage ?? 50,
      category: item.category || '',
      displayOrder: item.displayOrder ?? 0,
      featured: item.featured !== false,
      isActive: item.isActive !== false,
      logoFile: undefined,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (item) => {
    const loadingToastId = toast.loading(
      item.isActive ? 'Deactivating skill...' : 'Activating skill...'
    );

    try {
      await updateMutation.mutateAsync({
        id: item._id,
        payload: { isActive: !item.isActive },
      });

      toast.update(loadingToastId, {
        type: 'success',
        title: item.isActive ? 'Skill Deactivated' : 'Skill Activated',
        message: `${item.skill} has been ${item.isActive ? 'deactivated' : 'activated'}.`,
        persistent: false,
      });
    } catch (error) {
      toast.update(loadingToastId, {
        type: 'error',
        title: 'Toggle Failed',
        message: getErrorMessage(error),
        persistent: false,
      });
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const loadingToastId = toast.loading(
      editingItem ? 'Updating skill...' : 'Creating skill...'
    );
    const shouldTrackUpload = Boolean(values.logoFile);

    try {
      if (shouldTrackUpload) {
        setIsUploading(true);
        setUploadProgress(1);
      }

      const payload = {
        skill: values.skill,
        percentage: values.percentage,
        category: values.category,
        displayOrder: values.displayOrder,
        featured: values.featured,
        isActive: values.isActive,
        logoFile: values.logoFile,
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
        title: editingItem ? 'Skill Updated' : 'Skill Added',
        message: 'Action completed successfully.',
        persistent: false,
      });
      resetModal();
    } catch (error) {
      toast.update(loadingToastId, {
        type: 'error',
        title: 'Skill Action Failed',
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

    const loadingToastId = toast.loading('Deleting skill...');
    try {
      await deleteMutation.mutateAsync(deletingItem._id);
      toast.update(loadingToastId, {
        type: 'success',
        title: 'Skill Deleted',
        message: 'Skill removed successfully.',
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">Create, update, and manage your skill records.</p>
        <Button variant="primary" className="gap-1.5 px-3 py-1.5" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Skill
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        />
      </div>

      {skillsQuery.isLoading ? (
        <SectionSkeleton cardCount={3} />
      ) : (
        <AdminTable
          columns={[
            {
              key: 'logo',
              header: 'Logo',
              render: (row) =>
                row.logo ? (
                  <img
                    src={row.logo}
                    alt={row.skill}
                    className="h-8 w-8 rounded-md border border-zinc-800 bg-zinc-900 object-contain p-0.5"
                  />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-xs text-zinc-500">
                    —
                  </span>
                ),
            },
            { key: 'skill', header: 'Skill' },
            {
              key: 'percentage',
              header: 'Proficiency',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-zinc-300"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400">{row.percentage}%</span>
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Category',
              render: (row) => row.category || '-',
            },
            {
              key: 'displayOrder',
              header: 'Order',
              render: (row) => row.displayOrder ?? 0,
            },
            {
              key: 'isActive',
              header: 'Status',
              render: (row) => (
                <button
                  type="button"
                  onClick={() => handleToggleActive(row)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors ${
                    row.isActive
                      ? 'border-emerald-800/50 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                  }`}
                >
                  {row.isActive ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  {row.isActive ? 'Active' : 'Inactive'}
                </button>
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
          rows={filteredItems}
          emptyMessage="No Skills Found!"
        />
      )}

      <AdminFormModal
        open={isModalOpen}
        title={editingItem ? 'Update Skill' : 'Add Skill'}
        onClose={resetModal}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label htmlFor="skill-name" className="text-sm text-zinc-300">
              Skill Name *
            </label>
            <input
              id="skill-name"
              type="text"
              placeholder="e.g. React.js"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              {...form.register('skill')}
            />
            {form.formState.errors.skill ? (
              <p className="text-xs text-zinc-500">{form.formState.errors.skill.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="skill-percentage" className="text-sm text-zinc-300">
                Proficiency (%) *
              </label>
              <input
                id="skill-percentage"
                type="number"
                min="0"
                max="100"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('percentage')}
              />
              {form.formState.errors.percentage ? (
                <p className="text-xs text-zinc-500">
                  {form.formState.errors.percentage.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="skill-category" className="text-sm text-zinc-300">
                Category
              </label>
              <input
                id="skill-category"
                type="text"
                placeholder="e.g. Frontend"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('category')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="skill-order" className="text-sm text-zinc-300">
                Display Order
              </label>
              <input
                id="skill-order"
                type="number"
                min="0"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('displayOrder')}
              />
            </div>

            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-1.5 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  className="rounded border-zinc-700"
                  {...form.register('featured')}
                />
                Featured
              </label>
              <label className="flex items-center gap-1.5 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  className="rounded border-zinc-700"
                  {...form.register('isActive')}
                />
                Active
              </label>
            </div>
          </div>

          <FileUploadField
            id="skill-logo"
            label="Skill Logo"
            accept="image/*"
            file={selectedLogoFile}
            previewUrl={previewUrl || editingItem?.logo || ''}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            helperText={
              editingItem
                ? 'Upload a new image to replace the existing logo (max 5MB)'
                : 'JPG, PNG, or WEBP (max 5MB) — optional'
            }
            onClear={() => {
              const input = document.getElementById('skill-logo');
              if (input) {
                input.value = '';
              }
              resetPreview();
              form.setValue('logoFile', undefined, { shouldValidate: true, shouldDirty: true });
            }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                resetPreview();
                form.setValue('logoFile', undefined, { shouldValidate: true });
                return;
              }

              if (!allowedImageTypes.has(file.type)) {
                toast.warning('Please select JPG, PNG, or WEBP image.', 'Invalid Image Type');
                form.setError('logoFile', {
                  type: 'manual',
                  message: 'Only JPG, PNG, or WEBP images are allowed',
                });
                event.target.value = '';
                return;
              }

              if (file.size > MAX_IMAGE_BYTES) {
                toast.warning('Image must be 5MB or less.', 'File Too Large');
                form.setError('logoFile', {
                  type: 'manual',
                  message: 'Image size must be 5MB or less',
                });
                event.target.value = '';
                return;
              }

              form.clearErrors('logoFile');
              form.setValue('logoFile', file, { shouldValidate: true, shouldDirty: true });
              setUploadProgress(0);
              setPreviewUrl((current) => {
                if (current?.startsWith('blob:')) {
                  URL.revokeObjectURL(current);
                }
                return URL.createObjectURL(file);
              });
            }}
            error={form.formState.errors.logoFile?.message}
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
        title="Delete Skill"
        description="This action permanently removes the selected skill."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeletingItem(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default memo(AdminSkillsPage);
