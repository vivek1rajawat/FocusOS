import api from './api';

export const getDashboard = () => api.get('/dashboard').then((r) => r.data.dashboard);
export const getAnalytics = (params) => api.get('/analytics', { params }).then((r) => r.data.analytics);
export const globalSearch = (q) => api.get('/search', { params: { q } }).then((r) => r.data.results);

export const getNotifications = () => api.get('/notifications').then((r) => r.data);
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`).then((r) => r.data);
export const markAllNotificationsRead = () => api.put('/notifications/read-all').then((r) => r.data);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`).then((r) => r.data);
