import { memo, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminTable from '../../components/admin/AdminTable';
import AdminFormModal from '../../components/admin/AdminFormModal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Button from '../../components/ui/Button';
import { adminExperienceSchema } from '../../schemas/adminForms';
import {
  useAdminExperiencesQuery,
  useCreateAdminExperienceMutation,
  useDeleteAdminExperienceMutation,
  useUpdateAdminExperienceMutation,
} from '../../hooks/useAdminApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import SectionSkeleton from '../../components/common/SectionSkeleton';
import { formatExperiencePeriod } from '../../utils/date';

const AdminExperiencesPage = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const experiencesQuery = useAdminExperiencesQuery();
  const createMutation = useCreateAdminExperienceMutation();
  const updateMutation = useUpdateAdminExperienceMutation();
  const deleteMutation = useDeleteAdminExperienceMutation();
  const toast = useToast();

  const form = useForm({
    resolver: zodResolver(adminExperienceSchema),
    defaultValues: {
      company: '',
      role: '',
      duration: '',
      startDate: '',
      endDate: '',
      isCurrentlyWorking: false,
      description: '',
    },
  });
  const isCurrentlyWorking = useWatch({
    control: form.control,
    name: 'isCurrentlyWorking',
  });

  useEffect(() => {
    if (experiencesQuery.isError) {
      toast.error(getErrorMessage(experiencesQuery.error), 'Experiences Load Failed');
    }
  }, [experiencesQuery.error, experiencesQuery.isError, toast]);

  useEffect(() => {
    if (!isCurrentlyWorking) {
      return;
    }

    form.setValue('endDate', '', { shouldDirty: true, shouldValidate: true });
  }, [form, isCurrentlyWorking]);

  const items = experiencesQuery.data?.items || [];

  const resetModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    form.reset({
      company: '',
      role: '',
      duration: '',
      startDate: '',
      endDate: '',
      isCurrentlyWorking: false,
      description: '',
    });
  };

  const openCreateModal = () => {
    setEditingItem(null);
    resetModal();
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    form.reset({
      company: item.company || '',
      role: item.role || '',
      duration: item.duration || '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : '',
      isCurrentlyWorking: Boolean(item.isCurrentlyWorking),
      description: item.description || '',
    });
    setModalOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const loadingToastId = toast.loading(editingItem ? 'Updating experience...' : 'Creating experience...');
    try {
      const payload = {
        company: values.company,
        role: values.role,
        duration: values.duration || '',
        startDate: values.startDate,
        endDate: values.isCurrentlyWorking ? null : values.endDate || null,
        isCurrentlyWorking: values.isCurrentlyWorking,
        description: values.description,
      };

      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem._id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      toast.update(loadingToastId, {
        type: 'success',
        title: editingItem ? 'Experience Updated' : 'Experience Added',
        message: 'Action completed successfully.',
        persistent: false,
      });
      resetModal();
    } catch (error) {
      toast.update(loadingToastId, {
        type: 'error',
        title: 'Experience Action Failed',
        message: getErrorMessage(error),
        persistent: false,
      });
    }
  });

  const confirmDelete = async () => {
    if (!deletingItem) {
      return;
    }

    const loadingToastId = toast.loading('Deleting experience...');
    try {
      await deleteMutation.mutateAsync(deletingItem._id);
      toast.update(loadingToastId, {
        type: 'success',
        title: 'Experience Deleted',
        message: 'Experience removed successfully.',
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
        <p className="text-sm text-zinc-400">Manage work experience records with CRUD operations.</p>
        <Button variant="primary" className="gap-1.5 px-3 py-1.5" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Experience
        </Button>
      </div>

      {experiencesQuery.isLoading ? (
        <SectionSkeleton cardCount={3} />
      ) : (
        <AdminTable
          columns={[
            { key: 'company', header: 'Company' },
            { key: 'role', header: 'Role' },
            {
              key: 'period',
              header: 'Period',
              render: (row) => formatExperiencePeriod(row),
            },
            {
              key: 'description',
              header: 'Description',
              render: (row) => (
                <p className="max-w-sm truncate" title={row.description}>
                  {row.description}
                </p>
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
          emptyMessage="No Experience Found!"
        />
      )}

      <AdminFormModal
        open={isModalOpen}
        title={editingItem ? 'Update Experience' : 'Add Experience'}
        onClose={resetModal}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="experience-company" className="text-sm text-zinc-300">
                Company
              </label>
              <input
                id="experience-company"
                type="text"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('company')}
              />
              {form.formState.errors.company ? (
                <p className="text-xs text-zinc-500">{form.formState.errors.company.message}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="experience-role" className="text-sm text-zinc-300">
                Role
              </label>
              <input
                id="experience-role"
                type="text"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('role')}
              />
              {form.formState.errors.role ? (
                <p className="text-xs text-zinc-500">{form.formState.errors.role.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="experience-start-date" className="text-sm text-zinc-300">
                Start Date
              </label>
              <input
                id="experience-start-date"
                type="date"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                {...form.register('startDate')}
              />
              {form.formState.errors.startDate ? (
                <p className="text-xs text-zinc-500">{form.formState.errors.startDate.message}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="experience-end-date" className="text-sm text-zinc-300">
                End Date
              </label>
              <input
                id="experience-end-date"
                type="date"
                disabled={isCurrentlyWorking}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-zinc-600"
                {...form.register('endDate')}
              />
              {form.formState.errors.endDate ? (
                <p className="text-xs text-zinc-500">{form.formState.errors.endDate.message}</p>
              ) : null}
            </div>
          </div>

          <label
            htmlFor="experience-currently-working"
            className="inline-flex items-center gap-2 text-sm text-zinc-300"
          >
            <input
              id="experience-currently-working"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-zinc-200 focus:ring-zinc-600"
              {...form.register('isCurrentlyWorking')}
            />
            Currently Working
          </label>

          <div className="space-y-1">
            <label htmlFor="experience-duration" className="text-sm text-zinc-300">
              Custom Period (optional)
            </label>
            <input
              id="experience-duration"
              type="text"
              placeholder="Optional fallback text"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              {...form.register('duration')}
            />
            {form.formState.errors.duration ? (
              <p className="text-xs text-zinc-500">{form.formState.errors.duration.message}</p>
            ) : (
              <p className="text-xs text-zinc-500">
                Leave empty to auto-generate timeline period from dates.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="experience-description" className="text-sm text-zinc-300">
              Description
            </label>
            <textarea
              id="experience-description"
              rows={4}
              className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              {...form.register('description')}
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-zinc-500">{form.formState.errors.description.message}</p>
            ) : null}
          </div>

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
        title="Delete Experience"
        description="This action permanently removes the selected experience."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeletingItem(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default memo(AdminExperiencesPage);
