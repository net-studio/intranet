import { create } from 'apisauce'

const API_URL = 'https://robine-api.net-studio.fr';
// const API_URL = "http://localhost:1341";

const api = create({
  baseURL: API_URL + "/api",
  headers: {
    "Authorization": "Bearer 99d2e241bb7ba3fba491061b820abeb2e2650afba3b407ed131a082bbe2da469550e49a0cfe830d3848b0c61da6f364f67b5b6dfe8bd05921e493402c5f584a7cd5f9fc3ecc5cb4063f6fc2504fda48072652354856b542230995295d7665b19db4cf0b58dc09162eb8e269d7957c5d19eb11a4a9ffba6ec04a8fc48787132bc"
  },
})

const getLogin = (email) => api.get(`/collaborateurs?fields[0]=id&fields[1]=prenom&fields[2]=nom&fields[3]=telephone&fields[4]=email&fields[5]=password&fields[6]=documentId&populate[0]=photo&filters[email][$eq]=${email}`);
const getCollaborateur = (p) => api.get(`/collaborateurs?populate=*&sort[0]=prenom&sort[1]=nom&filters[documentId][$ne]=ejj7ra6lycouw297dhbb34bb&pagination[page]=${p}&pagination[pageSize]=25`);
const getAgences = (p) => api.get(`/agences?fields[0]=id&fields[1]=label&sort=label:ASC&pagination[page]=${p}&pagination[pageSize]=25`);
const getActualites = (p) => api.get(`/events?populate=*&sort=position:ASC&pagination[page]=${p}&pagination[pageSize]=25`);
const getAgenda = (p) => api.get(`/agendas?populate=*&sort=position:ASC&pagination[page]=${p}&pagination[pageSize]=25`);
const getLastActualite = () => api.get(`/events?populate=*&sort=position:ASC&pagination[page]=1&pagination[pageSize]=1`);
const getMessages = (p, pSize) => api.get(`/messages?sort=createdAt:ASC&pagination[page]=${p}&pagination[pageSize]=${pSize}&populate[0]=sent_by&populate[1]=attachments`);
const setNewMessage = (data) => api.post('/messages', data);
const getUnreadMessages = (sent_by) => api.get(`/messages?sort=createdAt:DESC&pagination[limit]=100&filters[read][$eq]=false&filters[sent_by][documentId][$ne]=${sent_by}`);
const updateMessage = (documentId, data) => api.put(`/messages/${documentId}?status=published`, data);

const getAllUnreadMessages = (sent_by) => api.get(`/messages?sort=createdAt:DESC&pagination[limit]=100&filters[read][$eq]=false&filters[sent_by][documentId][$ne]=${sent_by}`);
// Fonction pour récupérer tous les messages après un certain ID
const getMessagesAfterID = (id, pageSize = 20) => api.get(`/messages?sort=createdAt:ASC&pagination[pageSize]=${pageSize}&filters[id][$gt]=${id}`);
// Fonction pour récupérer les derniers messages
const getLatestMessages = (pageSize = 5) => api.get(`/messages?sort=createdAt:DESC&pagination[pageSize]=${pageSize}`);

const uploadFiles = (formData) => api.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});

const filterCollaborateur = (documentId) => api.get(`/collaborateurs?filters[documentId][$eq]=${documentId}&status=published`);
const getApiToken = (token) => api.get(`/fcm-tokens?filters[token][$eq]=${token}`);
const createToken = (data) => api.post('/fcm-tokens', data);
const updateToken = (documentId, data) => api.put(`/fcm-tokens/${documentId}`, data);
const getNotifications = (documentId, page, pageSize) => api.get(`/notifications?filters[user][documentId][$eq]=${documentId}&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`);
const getUnreadNotifications = (documentId) => api.get(`/notifications?filters[user][documentId][$eq]=${documentId}&filters[read][$eq]=false`);
const updateNotification = (documentId, data) => api.put(`/notifications/${documentId}?status=published`, data);
const testNotification = (data) => api.post(`/notifications/test`, data);
const markAllAsRead = (data) => api.put(`/notifications/mark-all-read`, data);
const deleteNotification = (documentId) => api.delete(`/notifications/${documentId}`);
const getEvents = (userId) => api.get(`/events?filters[$or][0][participants][id][$in]=${userId}&filters[$or][1][isPublic][$eq]=true&sort[0]=startDate:asc&populate[organizer][fields][0]=*&populate[participants][fields][0]=*&populate[location][fields][0]=*`);
const setEventResponse = (data) => api.post('/event-responses', data);
const createEvent = (data) => api.post('/events', data);
const setNewPass = (id, data) => api.put(`/collaborateurs/${id}`, data);

export default {
  api,
  API_URL,
  getLogin,
  getCollaborateur,
  getAgences,
  getActualites,
  getLastActualite,
  getAgenda,
  getMessages,
  setNewMessage,
  getUnreadMessages,
  updateMessage,
  getAllUnreadMessages,
  getMessagesAfterID,
  getLatestMessages,
  uploadFiles,
  filterCollaborateur,
  getApiToken,
  createToken,
  updateToken,
  getNotifications,
  getUnreadNotifications,
  updateNotification,
  testNotification,
  markAllAsRead,
  deleteNotification,
  getEvents,
  setEventResponse,
  createEvent,
  setNewPass
}