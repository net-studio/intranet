// src/components/messaging/MessageBubble.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES } from '../../Shared/Theme';

/**
 * Bulle de message pour l'écran de conversation
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.message - Objet message
 * @param {boolean} props.isMine - Si le message est envoyé par l'utilisateur courant
 * @param {Function} props.onImagePress - Fonction à exécuter lors du clic sur une image
 */
const MessageBubble = ({ message, isMine, onImagePress }) => {
  // Formater l'heure du message
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Vérifier si le contenu contient des liens
  const parseContent = (content) => {
    if (!content) return null;
    
    // Regex pour détecter les URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    if (parts.length === 1) {
      // Pas de lien dans le message
      return <Text style={styles.messageText}>{content}</Text>;
    }
    
    // Construire le contenu avec des liens cliquables
    return (
      <Text style={styles.messageText}>
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            return (
              <Text
                key={index}
                style={styles.linkText}
                onPress={() => Linking.openURL(part)}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };
  
  // Rendu d'une pièce jointe de type image
  const renderImageAttachment = (attachment) => (
    <TouchableOpacity
      key={attachment.id}
      onPress={() => onImagePress && onImagePress(attachment.url)}
      style={styles.imageContainer}
    >
      <Image
        source={{ uri: attachment.url }}
        style={styles.attachmentImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
  
  // Rendu d'une pièce jointe de type document
  const renderDocumentAttachment = (attachment) => (
    <TouchableOpacity
      key={attachment.id}
      onPress={() => Linking.openURL(attachment.url)}
      style={styles.documentContainer}
    >
      <Icon
        name="document"
        size={24}
        color={COLORS.primary}
        style={styles.documentIcon}
      />
      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>
          {attachment.name}
        </Text>
        <Text style={styles.documentMeta}>
          {getFileExtension(attachment.name).toUpperCase()} •{' '}
          {formatFileSize(attachment.size)}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  // Obtenir l'extension d'un fichier
  const getFileExtension = (filename) => {
    return filename.split('.').pop();
  };
  
  // Formater la taille d'un fichier
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };
  
  // Déterminer si une pièce jointe est une image
  const isImageAttachment = (attachment) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = getFileExtension(attachment.name).toLowerCase();
    return imageExtensions.includes(extension) || attachment.mime?.startsWith('image/');
  };
  
  // Rendu des pièces jointes
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;
    
    return (
      <View style={styles.attachmentsContainer}>
        {message.attachments.map((attachment) => {
          if (isImageAttachment(attachment)) {
            return renderImageAttachment(attachment);
          } else {
            return renderDocumentAttachment(attachment);
          }
        })}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, isMine ? styles.myMessageContainer : styles.otherMessageContainer]}>
      {!isMine && message.sentBy && (
        <Text style={styles.senderName}>{message.sentBy.username}</Text>
      )}
      
      {renderAttachments()}
      
      {message.content && (
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
          {parseContent(message.content)}
          
          <Text style={styles.timestamp}>
            {formatTime(message.createdAt)}
            {isMine && (
              <>
                {message.read ? (
                  <Icon name="checkmark-done" size={14} color={COLORS.primary} style={styles.readIcon} />
                ) : (
                  <Icon name="checkmark" size={14} color={COLORS.darkGray} style={styles.readIcon} />
                )}
              </>
            )}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.xs,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
    marginBottom: 2,
  },
  bubble: {
    padding: SIZES.sm,
    borderRadius: SIZES.md,
    borderBottomLeftRadius: SIZES.xs,
    borderBottomRightRadius: SIZES.xs,
  },
  myBubble: {
    backgroundColor: COLORS.lightGray,
    borderTopLeftRadius: SIZES.md,
    borderTopRightRadius: SIZES.xs,
  },
  otherBubble: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.xs,
    borderTopRightRadius: SIZES.md,
  },
  messageText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
  },
  linkText: {
    ...FONTS.body1,
    color: COLORS.secondary,
    textDecorationLine: 'underline',
  },
  timestamp: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    alignSelf: 'flex-end',
    marginTop: SIZES.xs,
    fontSize: 10,
  },
  readIcon: {
    marginLeft: SIZES.xs,
  },
  attachmentsContainer: {
    marginBottom: SIZES.xs,
  },
  imageContainer: {
    borderRadius: SIZES.sm,
    overflow: 'hidden',
    marginBottom: SIZES.xs,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    backgroundColor: COLORS.lightGray,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.sm,
    padding: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  documentIcon: {
    marginRight: SIZES.sm,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
  },
  documentMeta: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
});

export default MessageBubble;