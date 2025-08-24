import api from './api';

export const createPost = async ({ content, images, isAnonymous }) => {
  const { data } = await api.post('/posts', { content, images, isAnonymous });
  return data;
};

export const getPosts = async () => {
  const { data } = await api.get('/posts');
  return data;
};

export const getPost = async (postId) => {
  const { data } = await api.get(`/posts/${postId}`);
  return data;
};

export const toggleLike = async (postId) => {
  const { data } = await api.post(`/posts/${postId}/like`);
  return data;
};

export const deletePost = async (postId) => {
  const { data } = await api.delete(`/posts/${postId}`);
  return data;
};

export const reportPost = async (postId) => {
  const { data } = await api.post(`/posts/${postId}/report`);
  return data;
};

export const getUserPosts = async (userId) => {
  const { data } = await api.get(`/posts/user/${userId}`);
  return data;
};