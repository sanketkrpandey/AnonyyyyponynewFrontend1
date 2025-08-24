import api from './api';

export const createComment = async (postId, text) => {
  const { data } = await api.post(`/comments/post/${postId}`, { text });
  return data;
};

export const getComments = async (postId) => {
  const { data } = await api.get(`/comments/post/${postId}`);
  return data;
};

export const toggleCommentLike = async (commentId) => {
  const { data } = await api.post(`/comments/${commentId}/like`);
  return data;
};

export const deleteComment = async (commentId) => {
  const { data } = await api.delete(`/comments/${commentId}`);
  return data;
};

export const addReply = async (commentId, text) => {
  const { data } = await api.post(`/comments/${commentId}/reply`, { text });
  return data;
};