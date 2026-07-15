import api from './api';

export const getNotes = (params) => api.get('/notes', { params }).then((r) => r.data.notes);
export const getNote = (id) => api.get(`/notes/${id}`).then((r) => r.data.note);
export const createNote = (data) => api.post('/notes', data).then((r) => r.data.note);
export const updateNote = (id, data) => api.put(`/notes/${id}`, data).then((r) => r.data.note);
export const deleteNote = (id) => api.delete(`/notes/${id}`).then((r) => r.data);
