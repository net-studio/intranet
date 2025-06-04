// src/screens/messaging/ChatRoomScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import messagingService from '../../Shared/messagingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// Composants
import MessageBubble from '../../Components/Messaging/MessageBubble';

const ChatRoomScreen = ({ route, navigation }) => {
  const { conversation, conversationId } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userDocId, setUserDocId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef(null);

  // Récupérer l'ID de conversation soit directement, soit à partir de l'objet conversation
  const chatId = conversationId || conversation?.id;

  // Charger la conversation et les messages
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Récupérer l'ID utilisateur courant
        const currentUserId = await AsyncStorage.getItem('user_id');
        setUserId(currentUserId);

        const currentUserDocId = await AsyncStorage.getItem('user_doc_id');
        setUserDocId(currentUserDocId);
        
        // Si nous n'avons que l'ID de conversation, récupérer les détails de la conversation
        if (conversationId && !conversation) {
          const conversations = await messagingService.fetchConversations();
          const foundConversation = conversations.find(c => c.id.toString() === conversationId.toString());
          if (foundConversation) {
            setCurrentConversation(foundConversation);
          }
        } else {
          setCurrentConversation(conversation);
        }
        
        // Récupérer les messages
        await loadMessages();
      } catch (error) {
        console.error('Erreur lors du chargement des données de conversation:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Configurer les écouteurs en temps réel
    const unsubscribe = messagingService.setupRealtimeListeners(
      handleNewMessage,
      handleConversationUpdate
    );
    
    return () => {
      // Nettoyage à la destruction du composant
      unsubscribe;
    };
  }, [chatId]);

  // Charger les messages
  const loadMessages = async (refresh = false) => {
    if (!chatId || (loading && !refresh)) return;
    
    try {
      const newPage = refresh ? 1 : page;
      const result = await messagingService.fetchMessages(conversation.documentId, chatId, newPage);
      
      if (refresh) {
        setMessages(result.data);
      } else {
        setMessages(prevMessages => [...prevMessages, ...result.data]);
      }
      
      setPage(newPage + 1);
      setHasMore(result.meta.pagination.page < result.meta.pagination.pageCount);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  // Gérer les nouveaux messages reçus en temps réel
  const handleNewMessage = (messageData) => {
    if (messageData.conversation.toString() !== chatId.toString()) return;
    
    // Ajouter le nouveau message à la liste
    setMessages(prevMessages => [...prevMessages, messageData]);
    
    // Faire défiler jusqu'au dernier message
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Gérer les mises à jour de conversation en temps réel
  const handleConversationUpdate = (conversationData) => {
    if (conversationData.id.toString() !== chatId.toString()) return;
    
    // Mettre à jour les détails de la conversation
    setCurrentConversation(prev => ({
      ...prev,
      ...conversationData,
    }));
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
    }
  };

  // Sélectionner une pièce jointe (image)
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Nous avons besoin de permissions pour accéder à votre galerie.');
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
          uri: asset.uri,
          name: asset.uri.split('/').pop(),
          type: `image/${asset.uri.split('.').pop()}`,
          size: asset.fileSize || 0,
        }]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
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
      await messagingService.sendMessage(
        conversation.documentId,
        chatId,
        trimmedText,
        attachments
      );
      
      // Réinitialiser les champs
      setInputText('');
      setAttachments([]);
      
      // Rafraîchir les messages
      await loadMessages(true);
      
      // Faire défiler jusqu'au dernier message
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      alert('Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  // Rendu d'un élément de message
  const renderMessage = ({ item }) => (
    <MessageBubble
      message={item}
      isMine={item.sentBy?.documentId.toString() === userDocId}
      onImagePress={(url) => {
        // Ouvrir l'image en plein écran
        navigation.navigate('ImageViewer', { url });
      }}
    />
  );

  // Rendu de l'en-tête de la conversation
  const renderHeader = () => {
    const conversationData = currentConversation || conversation;
    if (!conversationData) return null;
    
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.conversationInfo}
          onPress={() => navigation.navigate('ConversationDetails', { conversationId: chatId })}
        >
          <View style={styles.avatarContainer}>
            {conversationData.avatar ? (
              <Image source={{ uri: conversationData.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.defaultAvatar, { backgroundColor: conversationData.isGroup ? COLORS.secondary : COLORS.primary }]}>
                <Text style={styles.avatarText}>
                  {conversationData.isGroup ? 
                    <Icon name="people" size={20} color={COLORS.white} /> : 
                    conversationData.name?.charAt(0).toUpperCase()
                  }
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {conversationData.name}
            </Text>
            <Text style={styles.status}>
              {conversationData.isGroup ? 
                `${conversationData.participants?.length || 0} participants` : 
                'En ligne'
              }
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="ellipsis-vertical" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    );
  };

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
                  <Icon name="document" size={24} color={COLORS.primary} />
                </View>
              )}
              <Text style={styles.attachmentName} numberOfLines={1}>
                {item.name}
              </Text>
              <TouchableOpacity 
                style={styles.removeAttachment}
                onPress={() => removeAttachment(index)}
              >
                <Icon name="close-circle" size={20} color={COLORS.error} />
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
        <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
          <Icon name="document-attach" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <Icon name="image" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Écrivez un message..."
          placeholderTextColor={COLORS.darkGray}
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
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Icon name="send" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  if (loading && !messages.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderHeader()}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesContainer}
        inverted={false}
        onEndReached={loadPreviousMessages}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          hasMore && (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          )
        }
      />
      
      {renderInputBar()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
  },
  backButton: {
    padding: SIZES.xs,
  },
  conversationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZES.sm,
  },
  avatarContainer: {
    marginRight: SIZES.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  status: {
    ...FONTS.body2,
    color: COLORS.white + 'CC',
  },
  moreButton: {
    padding: SIZES.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: SIZES.md,
    paddingBottom: SIZES.xl,
  },
  loadMoreContainer: {
    alignItems: 'center',
    padding: SIZES.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: Platform.OS === 'ios' ? SIZES.sm : SIZES.xs,
    paddingHorizontal: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  attachButton: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    ...FONTS.body1,
    maxHeight: 100,
    color: COLORS.textPrimary,
    padding: SIZES.xs,
    backgroundColor: COLORS.lightGray + '40',
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginLeft: SIZES.sm,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.primary + '80',
  },
  attachmentsContainer: {
    padding: SIZES.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  attachmentItem: {
    width: 80,
    marginRight: SIZES.sm,
    alignItems: 'center',
    position: 'relative',
  },
  attachmentImage: {
    width: 70,
    height: 70,
    borderRadius: SIZES.sm,
  },
  attachmentFile: {
    width: 70,
    height: 70,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentName: {
    ...FONTS.caption,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  removeAttachment: {
    position: 'absolute',
    top: -5,
    right: 5,
    backgroundColor: COLORS.white,
    borderRadius: 10,
  },
});

export default ChatRoomScreen;