import { memo, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { adminUserRoleSchema } from '../../schemas/adminForms';
import {
  useAdminUsersQuery,
  useDeleteAdminUserMutation,
  useUpdateAdminUserRoleMutation,
} from '../../hooks/useAdminApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import SectionSkeleton from '../../components/common/SectionSkeleton';

const AdminUsersPage = () => {
  const [deletingItem, setDeletingItem] = useState(null);

  const usersQuery = useAdminUsersQuery();
  const roleMutation = useUpdateAdminUserRoleMutation();
  const deleteMutation = useDeleteAdminUserMutation();
  const toast = useToast();

  useEffect(() => {
    if (usersQuery.isError) {
      toast.error(getErrorMessage(usersQuery.error), 'Users Load Failed');
    }
  }, [usersQuery.error, usersQuery.isError, toast]);

  const items = usersQuery.data?.items || [];

  const updateRole = async (userId, nextRole) => {
    const validation = adminUserRoleSchema.safeParse({ role: nextRole });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || 'Invalid role');
      return;
    }

    const loadingToastId = toast.loading('Updating role...');
    try {
      await roleMutation.mutateAsync({ id: userId, role: nextRole });
      toast.update(loadingToastId, {
        type: 'success',
        title: 'Role Updated',
        message: 'User role changed successfully.',
        persistent: false,
      });
    } catch (error) {
      toast.update(loadingToastId, {
        type: 'error',
        title: 'Role Update Failed',
        message: getErrorMessage(error),
        persistent: false,
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) {
      return;
    }

    const loadingToastId = toast.loading('Deleting user...');
    try {
      await deleteMutation.mutateAsync(deletingItem._id);
      toast.update(loadingToastId, {
        type: 'success',
        title: 'User Deleted',
        message: 'User has been removed.',
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
      <p className="text-sm text-zinc-400">
        Manage user accounts, role assignment, and access controls.
      </p>

      {usersQuery.isLoading ? (
        <SectionSkeleton cardCount={3} />
      ) : (
        <AdminTable
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'email', header: 'Email' },
            {
              key: 'role',
              header: 'Role',
              render: (row) => (
                <select
                  value={row.role}
                  onChange={(event) => updateRole(row._id, event.target.value)}
                  disabled={roleMutation.isPending}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              ),
            },
            {
              key: 'createdAt',
              header: 'Created',
              render: (row) => new Date(row.createdAt).toLocaleDateString(),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) =>
                row.role === 'admin' ? (
                  <span className="text-xs text-zinc-500">Protected</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingItem(row)}
                    className="rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ),
            },
          ]}
          rows={items}
          emptyMessage="No users found."
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Delete User"
        description="This action permanently removes the selected user."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeletingItem(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default memo(AdminUsersPage);
