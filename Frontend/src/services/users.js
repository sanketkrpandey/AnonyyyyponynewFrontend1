import api from './api';

export const getMyProfile = async () => {
  const { data } = await api.get('/users/profile');
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await api.put('/users/profile', profileData);
  return data;
};

export const toggleFollow = async (userId) => {
  const { data } = await api.post(`/users/${userId}/follow`);
  return data;
};

export const getUserByAnonymousName = async (anonymousName) => {
  const { data } = await api.get(`/users/name/${encodeURIComponent(anonymousName)}`);
  return data;
};

export const searchUsers = async (query) => {
  const { data } = await api.get('/users/search', { params: { query } });
  return data;
};

export const toggleBlockUser = async (userId) => {
  const { data } = await api.post(`/users/${userId}/block`);
  return data;
};