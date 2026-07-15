import api from './api';

export const getGoals = () => api.get('/goals').then((r) => r.data.goals);
export const getGoal = (id) => api.get(`/goals/${id}`).then((r) => r.data.goal);
export const createGoal = (data) => api.post('/goals', data).then((r) => r.data.goal);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data).then((r) => r.data.goal);
export const deleteGoal = (id) => api.delete(`/goals/${id}`).then((r) => r.data);

export const addSubGoal = (id, title) => api.post(`/goals/${id}/subgoals`, { title }).then((r) => r.data.goal);
export const updateSubGoal = (id, subId, data) => api.put(`/goals/${id}/subgoals/${subId}`, data).then((r) => r.data.goal);
export const deleteSubGoal = (id, subId) => api.delete(`/goals/${id}/subgoals/${subId}`).then((r) => r.data.goal);
