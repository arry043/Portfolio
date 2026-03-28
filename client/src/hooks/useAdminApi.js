import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const adminQueryKeys = {
  analyticsSummary: ['admin', 'analytics-summary'],
  resumes: ['admin', 'resumes'],
  certificates: ['admin', 'certificates'],
  projects: ['admin', 'projects'],
  experiences: ['admin', 'experiences'],
  users: ['admin', 'users'],
  messages: ['admin', 'messages'],
};

const fetchAdminAnalyticsSummary = async () => {
  const response = await api.get('/analytics/summary');
  return response.data;
};

const fetchAdminResumes = async () => {
  const response = await api.get('/admin/resumes');
  return response.data;
};

const buildResumeFormData = (payload) => {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('category', payload.category);
  if (payload.file) {
    formData.append('file', payload.file);
  }
  if (payload.fileUrl) {
    formData.append('fileUrl', payload.fileUrl);
  }
  return formData;
};

const createAdminResume = async (payload) => {
  const { onUploadProgress, ...requestPayload } = payload;
  const response = await api.post('/admin/resumes', buildResumeFormData(requestPayload), {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(typeof onUploadProgress === 'function' ? { onUploadProgress } : {}),
  });
  return response.data;
};

const updateAdminResume = async ({ id, payload }) => {
  const { onUploadProgress, ...requestPayload } = payload;
  const response = await api.patch(`/admin/resumes/${id}`, buildResumeFormData(requestPayload), {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(typeof onUploadProgress === 'function' ? { onUploadProgress } : {}),
  });
  return response.data;
};

const deleteAdminResume = async (id) => {
  const response = await api.delete(`/admin/resumes/${id}`);
  return response.data;
};

const setAdminDefaultResume = async (id) => {
  const response = await api.patch(`/resume/set-default/${id}`);
  return response.data;
};

const fetchAdminCertificates = async () => {
  const response = await api.get('/certificates');
  return response.data;
};

const buildCertificateFormData = (payload) => {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('organization', payload.organization);
  if (payload.issueDate !== undefined) {
    formData.append('issueDate', payload.issueDate || '');
    formData.append('issuedDate', payload.issueDate || '');
  } else if (payload.issuedDate !== undefined) {
    formData.append('issueDate', payload.issuedDate || '');
    formData.append('issuedDate', payload.issuedDate || '');
  }
  const imageFile = payload.imageFile || payload.image;
  if (imageFile) {
    formData.append('image', imageFile);
  } else if (payload.imageUrl) {
    formData.append('image', payload.imageUrl);
  }
  return formData;
};

const createAdminCertificate = async (payload) => {
  const { onUploadProgress, ...requestPayload } = payload;
  const response = await api.post('/certificates', buildCertificateFormData(requestPayload), {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(typeof onUploadProgress === 'function' ? { onUploadProgress } : {}),
  });
  return response.data;
};

const updateAdminCertificate = async ({ id, payload }) => {
  const { onUploadProgress, ...requestPayload } = payload;
  const response = await api.patch(`/certificates/${id}`, buildCertificateFormData(requestPayload), {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(typeof onUploadProgress === 'function' ? { onUploadProgress } : {}),
  });
  return response.data;
};

const deleteAdminCertificate = async (id) => {
  const response = await api.delete(`/certificates/${id}`);
  return response.data;
};

const ADMIN_PROJECTS_PAGE_LIMIT = 50;

const fetchAdminProjectsPage = async (page) => {
  const response = await api.get('/projects', {
    params: { limit: ADMIN_PROJECTS_PAGE_LIMIT, page },
  });
  return response.data;
};

const fetchAdminProjects = async () => {
  const firstPage = await fetchAdminProjectsPage(1);
  const totalPages = Math.max(1, Number(firstPage?.meta?.pages) || 1);

  if (totalPages === 1) {
    return firstPage;
  }

  const remainingResponses = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchAdminProjectsPage(index + 2))
  );

  const mergedItems = [firstPage, ...remainingResponses].flatMap((response) => response?.items || []);

  return {
    ...firstPage,
    items: mergedItems,
    meta: {
      ...(firstPage?.meta || {}),
      page: 1,
      pages: 1,
      total: mergedItems.length,
      limit: mergedItems.length,
    },
  };
};

const buildProjectFormData = (payload) => {
  const formData = new FormData();

  if (payload.name !== undefined) {
    formData.append('name', payload.name);
  }
  if (payload.description !== undefined) {
    formData.append('description', payload.description);
  }
  if (payload.category !== undefined) {
    formData.append('category', payload.category);
  }
  if (payload.tags !== undefined) {
    formData.append('tags', payload.tags || '');
  }
  if (payload.github !== undefined) {
    formData.append('github', payload.github || '');
  }
  if (payload.live !== undefined) {
    formData.append('live', payload.live || '');
  }
  if (payload.date !== undefined) {
    formData.append('date', payload.date || '');
  }
  if (payload.projectDate !== undefined) {
    formData.append('projectDate', payload.projectDate || '');
  }
  if (payload.imageFile) {
    formData.append('image', payload.imageFile);
  } else if (payload.imageUrl) {
    formData.append('image', payload.imageUrl);
  }

  return formData;
};

const createAdminProject = async (payload) => {
  const { onUploadProgress, ...requestPayload } = payload;
  const response = await api.post('/projects', buildProjectFormData(requestPayload), {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(typeof onUploadProgress === 'function' ? { onUploadProgress } : {}),
  });
  return response.data;
};

const updateAdminProject = async ({ id, payload }) => {
  const { onUploadProgress, ...requestPayload } = payload;
  const response = await api.patch(`/projects/${id}`, buildProjectFormData(requestPayload), {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...(typeof onUploadProgress === 'function' ? { onUploadProgress } : {}),
  });
  return response.data;
};

const deleteAdminProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

const fetchAdminExperiences = async () => {
  const response = await api.get('/admin/experiences');
  return response.data;
};

const createAdminExperience = async (payload) => {
  const response = await api.post('/admin/experiences', payload);
  return response.data;
};

const updateAdminExperience = async ({ id, payload }) => {
  const response = await api.patch(`/admin/experiences/${id}`, payload);
  return response.data;
};

const deleteAdminExperience = async (id) => {
  const response = await api.delete(`/admin/experiences/${id}`);
  return response.data;
};

const fetchAdminUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

const updateAdminUserRole = async ({ id, role }) => {
  const response = await api.patch(`/admin/users/${id}/role`, { role });
  return response.data;
};

const deleteAdminUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

const fetchAdminMessages = async () => {
  const response = await api.get('/contact');
  return response.data;
};

export const useAdminAnalyticsSummaryQuery = () =>
  useQuery({
    queryKey: adminQueryKeys.analyticsSummary,
    queryFn: fetchAdminAnalyticsSummary,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });

export const useAdminResumesQuery = () =>
  useQuery({
    queryKey: adminQueryKeys.resumes,
    queryFn: fetchAdminResumes,
  });

export const useAdminCertificatesQuery = () =>
  useQuery({
    queryKey: adminQueryKeys.certificates,
    queryFn: fetchAdminCertificates,
  });

export const useAdminProjectsQuery = () =>
  useQuery({
    queryKey: adminQueryKeys.projects,
    queryFn: fetchAdminProjects,
  });

export const useAdminExperiencesQuery = () =>
  useQuery({
    queryKey: adminQueryKeys.experiences,
    queryFn: fetchAdminExperiences,
  });

export const useAdminUsersQuery = () =>
  useQuery({
    queryKey: adminQueryKeys.users,
    queryFn: fetchAdminUsers,
  });

export const useAdminMessagesQuery = () =>
  useQuery({
    queryKey: adminQueryKeys.messages,
    queryFn: fetchAdminMessages,
  });

export const useAdminAnalyticsDailyQuery = (days = 30) =>
  useQuery({
    queryKey: ['admin', 'analytics-daily', days],
    queryFn: () => api.get(`/analytics/daily?days=${days}`).then(res => res.data),
  });

export const useAdminAnalyticsMonthlyQuery = () =>
  useQuery({
    queryKey: ['admin', 'analytics-monthly'],
    queryFn: () => api.get('/analytics/monthly').then(res => res.data),
  });

export const useAdminAnalyticsYearlyQuery = () =>
  useQuery({
    queryKey: ['admin', 'analytics-yearly'],
    queryFn: () => api.get('/analytics/yearly').then(res => res.data),
  });

const createInvalidatingMutation = (mutationFn, keys) => {
  return () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn,
      onSuccess: async () => {
        await Promise.all(
          keys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
        );
      },
    });
  };
};

export const useCreateAdminResumeMutation = createInvalidatingMutation(createAdminResume, [
  adminQueryKeys.resumes,
]);

export const useUpdateAdminResumeMutation = createInvalidatingMutation(updateAdminResume, [
  adminQueryKeys.resumes,
]);

export const useDeleteAdminResumeMutation = createInvalidatingMutation(deleteAdminResume, [
  adminQueryKeys.resumes,
]);

export const useSetAdminDefaultResumeMutation = createInvalidatingMutation(
  setAdminDefaultResume,
  [adminQueryKeys.resumes]
);

export const useCreateAdminCertificateMutation = createInvalidatingMutation(
  createAdminCertificate,
  [adminQueryKeys.certificates]
);

export const useUpdateAdminCertificateMutation = createInvalidatingMutation(
  updateAdminCertificate,
  [adminQueryKeys.certificates]
);

export const useDeleteAdminCertificateMutation = createInvalidatingMutation(
  deleteAdminCertificate,
  [adminQueryKeys.certificates]
);

export const useCreateAdminProjectMutation = createInvalidatingMutation(createAdminProject, [
  adminQueryKeys.projects,
]);

export const useUpdateAdminProjectMutation = createInvalidatingMutation(updateAdminProject, [
  adminQueryKeys.projects,
]);

export const useDeleteAdminProjectMutation = createInvalidatingMutation(deleteAdminProject, [
  adminQueryKeys.projects,
]);

export const useCreateAdminExperienceMutation = createInvalidatingMutation(
  createAdminExperience,
  [adminQueryKeys.experiences]
);

export const useUpdateAdminExperienceMutation = createInvalidatingMutation(
  updateAdminExperience,
  [adminQueryKeys.experiences]
);

export const useDeleteAdminExperienceMutation = createInvalidatingMutation(
  deleteAdminExperience,
  [adminQueryKeys.experiences]
);

export const useUpdateAdminUserRoleMutation = createInvalidatingMutation(updateAdminUserRole, [
  adminQueryKeys.users,
]);

export const useDeleteAdminUserMutation = createInvalidatingMutation(deleteAdminUser, [
  adminQueryKeys.users,
]);

export { adminQueryKeys };
