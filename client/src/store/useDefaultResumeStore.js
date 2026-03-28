import { create } from 'zustand';
import { api, getErrorMessage } from '../lib/api';

const normalizeResume = (value) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return {
    _id: value._id || value.id || null,
    title: value.title || '',
    category: value.category || '',
    fileUrl: value.fileUrl || value.url || '',
    downloadUrl: value.downloadUrl || '',
    fileName: value.fileName || '',
    isDefault: Boolean(value.isDefault),
    createdAt: value.createdAt || null,
    updatedAt: value.updatedAt || null,
  };
};

let inFlightFetchTask = null;

const useDefaultResumeStore = create((set, get) => ({
  defaultResume: null,
  isLoading: false,
  error: null,
  hasFetched: false,

  setDefaultResume: (resumeData) => {
    set({
      defaultResume: normalizeResume(resumeData),
      isLoading: false,
      error: null,
      hasFetched: true,
    });
  },

  clearDefaultResume: () => {
    set({
      defaultResume: null,
      isLoading: false,
      error: null,
      hasFetched: true,
    });
  },

  fetchDefaultResume: async ({ force = false } = {}) => {
    const { hasFetched } = get();
    if (!force && hasFetched) {
      return get().defaultResume;
    }

    if (inFlightFetchTask) {
      return inFlightFetchTask;
    }

    set({ isLoading: true, error: null });

    const task = (async () => {
      try {
        const response = await api.get('/resume/default');
        const normalized = normalizeResume(response?.data?.item);
        set({
          defaultResume: normalized,
          isLoading: false,
          error: null,
          hasFetched: true,
        });
        return normalized;
      } catch (error) {
        if (error?.response?.status === 404) {
          set({
            defaultResume: null,
            isLoading: false,
            error: null,
            hasFetched: true,
          });
          return null;
        }

        set({
          defaultResume: null,
          isLoading: false,
          error: getErrorMessage(error),
          hasFetched: true,
        });
        return null;
      } finally {
        inFlightFetchTask = null;
      }
    })();

    inFlightFetchTask = task;
    return task;
  },
}));

export default useDefaultResumeStore;
