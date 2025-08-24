import api from './api';

export const sendRegistrationOtp = async ({ email }) => {
  const { data } = await api.post('/auth/send-otp', { email });
  return data;
};

export const verifyRegistrationOtp = async ({ email, otp }) => {
  const { data } = await api.post('/auth/verify-otp', { email, otp });
  return data;
};

export const sendLoginOtp = async ({ email }) => {
  const { data } = await api.post('/auth/login', { email });
  return data;
};

export const verifyLoginOtp = async ({ email, otp }) => {
  const { data } = await api.post('/auth/verify-login-otp', { email, otp });
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};
