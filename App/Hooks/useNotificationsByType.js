// App/Hooks/useNotificationsByType.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlobalApi from '../Shared/GlobalApi';

export const useNotificationsByType = () => {
  const [eventCount, setEventCount] = useState(0);
  const [agendaCount, setAgendaCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      
      const documentId = await AsyncStorage.getItem('documentId');
      
      if (!documentId) {
        console.warn('⚠️ Pas de documentId');
        return;
      }

      const response = await GlobalApi.getUnreadNotifications(documentId.replace(/"/g, ''));
      
      if (response && response.data && response.data.data) {
        const notifications = response.data.data;
        // console.log(`📋 Total notifications non lues: ${notifications.length}`);
        
        // ✅ Les données sont directement dans n, pas dans n.attributes
        const eventNotifs = notifications.filter(n => {
          const notifData = n.data || {}; // ✅ Pas de .attributes
          return notifData.eventId || (notifData.navigateTo === 'EventDetails');
        });
        
        const agendaNotifs = notifications.filter(n => {
          const notifData = n.data || {}; // ✅ Pas de .attributes
          return notifData.agendaId || (notifData.navigateTo === 'AgendaDetail');
        });
        
        // console.log(`✅ Counts - Events: ${eventNotifs.length}, Agenda: ${agendaNotifs.length}`);
        setEventCount(eventNotifs.length);
        setAgendaCount(agendaNotifs.length);
      }
    } catch (error) {
      console.error('❌ Erreur fetchCounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    
    const interval = setInterval(fetchCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { eventCount, agendaCount, loading, refresh: fetchCounts };
};

export default useNotificationsByType;