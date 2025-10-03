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

    // let queryParams = `filters[$or][0][participants][user][id]=${userId}&filters[$or][1][isPublic][$eq]=true&sort=startDate:asc&populate=organizer,participants.user`;
    // if (startDate) {
    //   queryParams += `&filters[startDate][$gte]=${startDate}`;
    // }
    // if (endDate) {
    //   queryParams += `&filters[endDate][$lte]=${endDate}`;
    // }
    // console.log('queryParams', queryParams);
    // const response = await api.get(`/api/events?${queryParams}`);
    // const events = response.data.data;

    // const query = qs.stringify({
    //   filters: {
    //     $or: [
    //       {
    //         participants: {
    //           id: {
    //             $in: [userId]
    //           }
    //         }
    //       },
    //       {
    //         isPublic: {
    //           $eq: true
    //         }
    //       }
    //     ]
    //   },
    //   sort: ['startDate:asc'],
    //   populate: {
    //     organizer: {
    //       fields: ['*']
    //     },
    //     participants: {
    //       fields: ['*']
    //     },
    //     location: {
    //       fields: ['*']
    //     }
    //   }
    // }, {
    //   encodeValuesOnly: true
    // });
    // console.log('query : ', query);
    // const response = await api.get(`/api/events?${query}`);
    // const events = response.data.data;
    const response = await GlobalApi.getEvents(userId);
    const events = response.data.data;

    // Récupérer les réponses de l'utilisateur pour ces événements
    const eventIds = events.map(event => event.documentId);
    console.log('eventIds : ', eventIds);

    const responseParams = `filters[event][documentId][$in]=${eventIds.join(',')}&filters[collaborateur][id]=${userId}`;
    const responseData = await GlobalApi.api.get(`/event-responses?${responseParams}`);
    const userResponses = responseData.data.data;

    console.log('userResponses : ', userResponses);
    // Créer un mapping des réponses par événement
    const responseMap = {};
    userResponses.forEach(resp => {
      responseMap[resp.documentId] = resp.response;
    });

    return events.map(event => formatEvent(event, responseMap[event.documentId] || null));
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
    const documentId = await AsyncStorage.getItem('documentId');

    // Obtenir le collaborateur
    const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
    const collaborateurs = collaborateurResponse.data.data;

    if (!collaborateurs || collaborateurs.length === 0) {
      throw new Error('Collaborateur non trouvé');
    }

    const collaborateurId = collaborateurs[0].id;

    // Préparer les données de l'événement SANS organizer pour l'instant
    const data = {
      data: {
        titre: eventData.title,
        texte: eventData.description ? [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: eventData.description
              }
            ]
          }
        ] : null,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location,
        category: eventData.category,
        isPublic: eventData.isPublic,
        requiresResponse: eventData.requiresResponse,
        allDay: eventData.allDay,
        // Ne pas envoyer organizer pour l'instant
      },
    };

    console.log('Données envoyées:', JSON.stringify(data, null, 2));

    const response = await GlobalApi.createEvent(data);

    console.log('Réponse API:', JSON.stringify(response.data, null, 2));

    // Strapi v5 : la réponse est directement dans response.data
    const createdEvent = response.data.data || response.data;

    if (!createdEvent) {
      throw new Error('Événement non créé');
    }

    return formatEvent(createdEvent, 'accepted');
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    throw error;
  }
};

// Fonction utilitaire pour formater les données d'événement
const formatEvent = (event, userResponse = null, includeDetails = false) => {

  // Information de base de l'événement
  const formattedEvent = {
    id: event.id,
    documentId: event.documentId,
    title: event.titre || event.title,
    texte: event.texte,
    startDate: event.startDate,
    endDate: event.endDate,
    allDay: event.allDay || false,
    location: event.location ? {
      id: event.location.id,
      name: event.location.name,
      address: event.location.address,
    } : null,
    isPublic: event.isPublic || false,
    category: event.category || 'other',
    color: event.color || '#3788d8',
    userResponse,
    requiresResponse: event.requiresResponse || false,
  };

  // Ajouter l'organisateur si disponible
  if (event.organizer) {
    formattedEvent.organizer = {
      id: event.organizer.id,
      prenom: event.organizer.prenom,
      nom: event.organizer.nom,
      avatar: event.organizer.photo?.url || null,
    };
  }

  // Ajouter les détails supplémentaires si demandés
  if (includeDetails) {
    // Participants
    if (event.participants && Array.isArray(event.participants)) {
      formattedEvent.participants = event.participants.map(participant => ({
        id: participant.id,
        prenom: participant.prenom,
        nom: participant.nom,
        response: participant.response || null,
      }));
    }

    // Pièces jointes
    if (event.attachments && Array.isArray(event.attachments)) {
      formattedEvent.attachments = event.attachments.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        mime: attachment.mime,
        size: attachment.size,
      }));
    }

    // Informations supplémentaires
    formattedEvent.recurring = event.recurring || false;
    formattedEvent.recurrenceRule = event.recurrenceRule || null;
    formattedEvent.reminder = event.reminder || null;
  }

  return formattedEvent;
};