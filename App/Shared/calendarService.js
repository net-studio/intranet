// src/api/calendarService.js
import api from './strapiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlobalApi from './GlobalApi';

export const fetchEvents = async (startDate = null, endDate = null) => {
  try {
    const documentId = await AsyncStorage.getItem('documentId');
    // Obtenir l'ID du collaborateur à partir du documentId
    const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
    const collaborateurs = collaborateurResponse.data.data;
    if (!collaborateurs || collaborateurs.length === 0) {
      console.warn('Collaborateur non trouvé avec le documentId:', documentId);
      return false;
    }
    const userId = collaborateurs[0].id;
    console.log("userId : ", userId);

    let queryParams = `filters[$or][0][participants][user][id]=${userId}&filters[$or][1][isPublic][$eq]=true&sort=startDate:asc&populate=organizer,participants.user`;

    if (startDate) {
      queryParams += `&filters[startDate][$gte]=${startDate}`;
    }

    if (endDate) {
      queryParams += `&filters[endDate][$lte]=${endDate}`;
    }
    console.log('queryParams', queryParams);
    const response = await api.get(`/api/events?${queryParams}`);
    const events = response.data.data;

    // Récupérer les réponses de l'utilisateur pour ces événements
    const eventIds = events.map(event => event.id);
    const responseParams = `filters[event][id][$in]=${eventIds.join(',')}&filters[user][id]=${userId}`;
    const responseData = await api.get(`/api/event-responses?${responseParams}`);
    const userResponses = responseData.data.data;

    // Créer un mapping des réponses par événement
    const responseMap = {};
    userResponses.forEach(resp => {
      responseMap[resp.attributes.event.data.id] = resp.attributes.response;
    });

    return events.map(event => formatEvent(event, responseMap[event.id] || null));
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    throw error;
  }
};

export const fetchEventById = async (id) => {
  try {
    const response = await api.get(`/api/events/${id}?populate=organizer,location,participants.user,attachments`);
    const event = response.data.data;

    // Récupérer la réponse de l'utilisateur pour cet événement
    const userId = await AsyncStorage.getItem('user_id');
    const responseData = await api.get(`/api/event-responses?filters[event][id]=${id}&filters[user][id]=${userId}`);
    const userResponse = responseData.data.data.length > 0 ? responseData.data.data[0].attributes.response : null;

    return formatEvent(event, userResponse, true);
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'événement ${id}:`, error);
    throw error;
  }
};

export const respondToEvent = async (eventId, response) => {
  try {
    const userId = await AsyncStorage.getItem('user_id');

    // Vérifier si une réponse existe déjà
    const existingResponseData = await api.get(`/api/event-responses?filters[event][id]=${eventId}&filters[user][id]=${userId}`);
    const existingResponse = existingResponseData.data.data;

    if (existingResponse.length > 0) {
      // Mettre à jour la réponse existante
      await api.put(`/api/event-responses/${existingResponse[0].id}`, {
        data: {
          response,
        },
      });
    } else {
      // Créer une nouvelle réponse
      await api.post('/api/event-responses', {
        data: {
          event: eventId,
          user: userId,
          response,
        },
      });
    }

    return {
      eventId,
      response,
    };
  } catch (error) {
    console.error(`Erreur lors de la réponse à l'événement ${eventId}:`, error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const userId = await AsyncStorage.getItem('user_id');

    // Préparer les données de l'événement
    const data = {
      ...eventData,
      organizer: userId,
      participants: eventData.participants.map(id => ({ user: id })),
    };

    const response = await api.post('/api/events', {
      data,
    });

    return formatEvent(response.data.data, 'accepted');
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    throw error;
  }
};

// Fonction utilitaire pour formater les données d'événement
const formatEvent = (event, userResponse = null, includeDetails = false) => {
  const attributes = event.attributes;

  // Information de base de l'événement
  const formattedEvent = {
    id: event.id,
    title: attributes.title,
    description: attributes.description,
    startDate: attributes.startDate,
    endDate: attributes.endDate,
    allDay: attributes.allDay || false,
    location: attributes.location?.data ? {
      id: attributes.location.data.id,
      name: attributes.location.data.attributes.name,
      address: attributes.location.data.attributes.address,
    } : null,
    isPublic: attributes.isPublic || false,
    category: attributes.category || 'other',
    color: attributes.color || '#3788d8',
    userResponse,
    requiresResponse: attributes.requiresResponse || false,
  };

  // Ajouter l'organisateur si disponible
  if (attributes.organizer?.data) {
    formattedEvent.organizer = {
      id: attributes.organizer.data.id,
      name: attributes.organizer.data.attributes.username,
      avatar: attributes.organizer.data.attributes.avatar?.data?.attributes.url || null,
    };
  }

  // Ajouter les détails supplémentaires si demandés
  if (includeDetails) {
    // Participants
    if (attributes.participants?.data) {
      formattedEvent.participants = attributes.participants.data.map(participant => ({
        id: participant.id,
        user: {
          id: participant.attributes.user.data.id,
          name: participant.attributes.user.data.attributes.username,
          avatar: participant.attributes.user.data.attributes.avatar?.data?.attributes.url || null,
        },
        response: participant.attributes.response || null,
      }));
    }

    // Pièces jointes
    if (attributes.attachments?.data) {
      formattedEvent.attachments = attributes.attachments.data.map(attachment => ({
        id: attachment.id,
        name: attachment.attributes.name,
        url: attachment.attributes.url,
        mime: attachment.attributes.mime,
        size: attachment.attributes.size,
      }));
    }

    // Informations supplémentaires
    formattedEvent.recurring = attributes.recurring || false;
    formattedEvent.recurrenceRule = attributes.recurrenceRule || null;
    formattedEvent.reminder = attributes.reminder || null;
  }

  return formattedEvent;
};