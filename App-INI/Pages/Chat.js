import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native'
import React, { useState, useEffect, useRef, useContext } from 'react'
import { AuthContext } from '../Context/AuthContext';
import Menu from '../Components/Menu';
import WelcomeHeader from '../Components/WelcomeHeader';
import messagingService from '../Shared/messagingService';
import MessageBubble from '../Components/MessageBubble';
import Colors from '../Shared/Colors';
import Icon from 'react-native-vector-icons/Ionicons';
import { DocumentPicker } from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import GlobalApi from '../Shared/GlobalApi';
import { getFCMToken } from '../Shared/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function Chat() {

  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const flatListRef = useRef(null);
  const { userData } = useContext(AuthContext);
  const [pollingActive, setPollingActive] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [image, setImage] = useState([]);

  useEffect(() => {
    let pollingInterval = null;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        await loadMessages();

        // Déterminer le dernier ID de message pour le polling
        if (messages.length > 0) {
          const messageIds = messages.map(msg => parseInt(msg.id || msg.documentId || 0));
          const maxId = Math.max(...messageIds);
          setLastMessageId(maxId);
          console.log("ID de départ pour le polling:", maxId);
        }
      } catch (error) {
        console.error('Erreur lors du chargement initial des messages:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fonction de polling pour vérifier les nouveaux messages
    const checkForNewMessages = async () => {
      if (!pollingActive || !userData || !userData.documentId) return;

      try {
        // console.log("Vérification des nouveaux messages...");

        // Utiliser l'API directement pour récupérer les messages non lus
        const response = await GlobalApi.getUnreadMessages(userData.documentId);

        if (!response || !response.data || !response.data.data) {
          console.warn("Pas de données valides reçues de l'API");
          return;
        }

        const unreadMessages = response.data.data;
        // console.log(`${unreadMessages.length} messages non lus trouvés`);

        if (unreadMessages.length > 0) {
          // Filtrer pour n'obtenir que les nouveaux messages
          const newMessages = unreadMessages.filter(msg => {
            const msgId = parseInt(msg.id || msg.documentId || 0);
            return msgId > lastMessageId;
          });

          if (newMessages.length > 0) {
            // console.log(`${newMessages.length} nouveaux messages à ajouter`);

            // Trouver le nouvel ID max
            const messageIds = newMessages.map(msg => parseInt(msg.id || msg.documentId || 0));
            const newMaxId = Math.max(...messageIds);

            // await messagingService.markConversationAsRead(userData);

            // Ajouter les nouveaux messages
            setMessages(prev => [...prev, ...newMessages]);

            // Mettre à jour le dernier ID connu
            setLastMessageId(newMaxId);

            // Marquer ces messages comme lus
            await Promise.all(
              newMessages.map(msg =>
                GlobalApi.updateMessage(msg.documentId, {
                  data: { "read": true }
                })
              )
            );

            // Faire défiler vers le bas après un court délai
            if (flatListRef.current) {
              setTimeout(() => {
                flatListRef.current.scrollToEnd({ animated: true });
              }, 300);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des nouveaux messages:", error);
      }
    };

    // Démarrer le chargement initial
    loadInitialData();

    // Configurer l'intervalle de polling (toutes les 5 secondes)
    // pollingInterval = setInterval(checkForNewMessages, 5000);

    // Nettoyage
    return () => {
      console.log("Nettoyage des timers et écouteurs");
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [userData, pollingActive]);

  // Fonction pour activer/désactiver le polling
  const togglePolling = () => {
    setPollingActive(prev => !prev);
  };

  // Ajouter un polling de secours pour les nouveaux messages
  useEffect(() => {
    // Si nous avons des messages et pas de polling actif
    if (messages.length > 0 && !pollingInterval) {
      // Garder trace du dernier ID de message
      const lastMsg = messages[messages.length - 1];
      setLastMessageId(lastMsg.id);

      // Configurer un intervalle pour vérifier les nouveaux messages
      const interval = setInterval(async () => {
        const newLastId = await messagingService.pollForNewMessages(
          lastMessageId,
          handleNewMessage
        );

        if (newLastId && newLastId !== lastMessageId) {
          setLastMessageId(newLastId);
        }
      }, 10000); // Vérifier toutes les 10 secondes

      setPollingInterval(interval);
    }

    // Nettoyage
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [messages, lastMessageId]);

  // Effet pour scroller vers le bas lorsque des messages sont ajoutés
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current && !loading) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100); // Petit délai pour s'assurer que le rendu est terminé
    }
  }, [messages, loading]);

  // Demander les permissions de notification
  const requestNotificationPermissions = async () => {
    if (Platform.OS === 'ios') {
      // Pour iOS, nous devons demander l'autorisation explicitement
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission de notifications refusée');
        return false;
      }
    }

    return true;
  };


  // Charger les messages
  const loadMessages = async (refresh = false) => {
    try {
      const newPage = refresh ? 1 : page;
      const result = await messagingService.fetchMessages(userData, newPage);

      if (refresh) {
        setMessages(result?.data || []);
      } else {
        setMessages(prevMessages => [...prevMessages, ...(result?.data || [])]);
      }

      // Stocker l'ID du message le plus récent pour le polling
      if (result?.data && result.data.length > 0) {
        setLastMessageId(result.data[result.data.length - 1].id);
      }

      setPage(newPage + 1);
      setHasMore(result.meta.pagination.page < result.meta.pagination.pageCount);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      Alert.alert('Erreur', 'Impossible de charger les messages. Veuillez réessayer.');
    }
  };

  // Gérer les nouveaux messages reçus en temps réel
  const handleNewMessage = (messageData) => {
    // Vérifier si nous avons déjà ce message (pour éviter les doublons)
    const messageExists = messages.some(m => m.documentId === messageData.documentId);

    if (!messageExists) {
      console.log('Ajout d\'un nouveau message à l\'état:', messageData);

      // Ajouter le nouveau message à la liste
      setMessages(prevMessages => [...prevMessages, messageData]);

      // Mettre à jour lastMessageId pour le polling
      if (messageData.id > lastMessageId) {
        setLastMessageId(messageData.id);
      }

      // Faire défiler jusqu'au dernier message
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }

      // Si le message n'est pas de l'utilisateur actuel, le marquer comme lu
      if (messageData.sent_by?.documentId !== userData.documentId) {
        messagingService.markConversationAsRead(userData);
      }
    }
  };

  // Charger les messages précédents
  const loadPreviousMessages = async () => {
    if (!hasMore || loading) return;
    await loadMessages();
  };

  // Sélectionner une pièce jointe (document)
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setAttachments(prev => [...prev, result]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le document.');
    }
  };

  // Sélectionner une pièce jointe (image)
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de permissions pour accéder à votre galerie.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled) {
        // Convertir le format ImagePicker au format DocumentPicker pour uniformité
        const asset = result.assets[0];
        setAttachments(prev => [...prev, {
          file: asset.file,
          uri: asset.uri,
          name: asset.fileName,
          type: asset.mimeType,
          size: asset.fileSize || 0,
        }]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image.');
    }
  };

  // Supprimer une pièce jointe
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Envoyer un message
  const sendMessage = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText && attachments.length === 0) return;

    try {
      setSending(true);

      // Envoyer le message
      const sentMessage = await messagingService.sendMessage(
        userData,
        trimmedText,
        attachments
      );

      // Réinitialiser les champs
      setInputText('');
      setAttachments([]);

      // Ajouter le message à la liste locale immédiatement
      // Cela permet une expérience utilisateur plus fluide
      const newMessage = {
        id: sentMessage.id,
        content: trimmedText,
        sent_by: {
          documentId: userData.documentId,
          prenom: userData.prenom,
          nom: userData.nom
        },
        attachments: [], // Les pièces jointes seront ajoutées par le backend
        createdAt: new Date().toISOString(),
        read: false
      };

      setMessages(prev => [...prev, newMessage]);

      // Faire défiler jusqu'au dernier message
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }

      // Optionnel: Rafraîchir les messages pour avoir les données complètes
      await loadMessages(true);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  // Afficher les détails d'un document
  const renderChatImage = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        {/* <View style={styles.modalContent}> */}
        <View style={{ flex: 1, width: '90%', justifyContent: 'center', height: `calc((${image.width} / ${image.height} * width))` }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              {/* <Icon name="close" size={24} color={Colors.textSecondary} /> */}
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: 'none', width: '100%', height: `calc((${image.height} / ${image.width}) * 90%)` }}>
            <Image
              source={{ uri: GlobalApi.API_URL + image?.url }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  // Rendu d'un élément de message
  const renderMessage = ({ item }) => (
    <MessageBubble
      apiurl={GlobalApi.API_URL}
      message={item}
      isMine={item.sent_by?.documentId === userData.documentId}
      onImagePress={(item) => { setImage(item), setModalVisible(true) }}
    />
  );

  // Rendu des pièces jointes sélectionnées
  const renderAttachments = () => {
    if (attachments.length === 0) return null;

    return (
      <View style={styles.attachmentsContainer}>
        <FlatList
          data={attachments}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `attachment-${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.attachmentItem}>
              {item.type?.startsWith('image/') ? (
                <Image source={{ uri: item.uri }} style={styles.attachmentImage} />
              ) : (
                <View style={styles.attachmentFile}>
                  <Icon name="document" size={24} color={Colors.primary} />
                </View>
              )}
              <Text style={styles.attachmentName} numberOfLines={1}>
                {item.name}
              </Text>
              <TouchableOpacity
                style={styles.removeAttachment}
                onPress={() => removeAttachment(index)}
              >
                <Icon name="close-circle" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  };

  // Rendu de la zone de saisie de message
  const renderInputBar = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {renderAttachments()}

      <View style={styles.inputContainer}>
        {/* <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
          <Icon name="document-attach" size={24} color={Colors.secondary} />
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <Icon name="image" size={24} color={Colors.secondary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Écrivez un message..."
          placeholderTextColor={Colors.darkGray}
          multiline
        />

        <TouchableOpacity
          style={[styles.sendButton,
          (!inputText.trim() && attachments.length === 0) ? styles.sendButtonDisabled : {}
          ]}
          onPress={sendMessage}
          disabled={(!inputText.trim() && attachments.length === 0) || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Icon name="send" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const refreshMessages = async () => {
    setLoading(true);
    await loadMessages(true);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.main}>
      <WelcomeHeader />

      <View style={styles.chatContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item?.id?.toString()}
            contentContainerStyle={styles.messagesContainer}
            onEndReached={loadPreviousMessages}
            onEndReachedThreshold={0.3}
            onRefresh={refreshMessages}
            refreshing={loading}
            ListHeaderComponent={
              hasMore && (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              )
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun message</Text>
              </View>
            }
            // Important: ne pas utiliser inverted avec scrollToEnd
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 100
            }}
          />
        )}
      </View>

      {renderInputBar()}
      {renderChatImage()}
      <Menu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex:100,
  },
  modalTitle: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  closeButton: {
    width: '100%',
    height: '100%',
    padding: 20,
  },
  main: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'System',
    fontSize: 16,
    color: Colors.darkGray,
  },
  loadMoreContainer: {
    alignItems: 'center',
    padding: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    marginHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachButton: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    maxHeight: 100,
    color: Colors.textPrimary,
    padding: 8,
    backgroundColor: Colors.lightGray + '40',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.primary + '80',
  },
  attachmentsContainer: {
    padding: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  attachmentItem: {
    width: 80,
    marginRight: 12,
    alignItems: 'center',
    position: 'relative',
  },
  attachmentImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  attachmentFile: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentName: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 8,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  removeAttachment: {
    position: 'absolute',
    top: -5,
    right: 5,
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
});