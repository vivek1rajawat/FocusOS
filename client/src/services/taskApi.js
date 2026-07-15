import api from './api';

export const getTasks = (params) => api.get('/tasks', { params }).then((r) => r.data.tasks);
export const getTask = (id) => api.get(`/tasks/${id}`).then((r) => r.data.task);
export const createTask = (data) => api.post('/tasks', data).then((r) => r.data.task);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data.task);
export const reorderTasks = (updates) => api.post('/tasks/reorder', { updates }).then((r) => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then((r) => r.data);
export const startTimer = (id) => api.post(`/tasks/${id}/timer/start`).then((r) => r.data.task);
export const stopTimer = (id) => api.post(`/tasks/${id}/timer/stop`).then((r) => r.data.task);
export const getActiveTimerTask = () => getTasks({ timerActive: 'true' }).then((tasks) => tasks[0] || null);

export const createSubtask = (data) => api.post('/subtasks', data).then((r) => r.data.subtask);
export const updateSubtask = (id, data) => api.put(`/subtasks/${id}`, data).then((r) => r.data.subtask);
export const deleteSubtask = (id) => api.delete(`/subtasks/${id}`).then((r) => r.data);
