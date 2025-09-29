// src/components/messaging/MessageBubble.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '../Shared/Colors';

/**
 * Bulle de message pour l'écran de conversation
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.message - Objet message
 * @param {boolean} props.isMine - Si le message est envoyé par l'utilisateur courant
 * @param {Function} props.onImagePress - Fonction à exécuter lors du clic sur une image
 */
const MessageBubble = ({ apiurl, message, isMine, onImagePress }) => {

  // Formater l'heure du message
  const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };

    return `${date.toLocaleDateString('fr-FR', dateOptions)}, ${date.toLocaleTimeString('fr-FR', timeOptions)}`;
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
      onPress={() => onImagePress && onImagePress(attachment)}
      style={styles.imageContainer}
    >
      <Image
        source={{ uri: apiurl + attachment.url }}
        style={{ width: 200, height: 200 / attachment.width * attachment.height }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  // Rendu d'une pièce jointe de type document
  const renderDocumentAttachment = (attachment) => (
    <TouchableOpacity
      key={attachment.id}
      onPress={() => Linking.openURL(apiurl + attachment.url)}
      style={styles.documentContainer}
    >
      <Icon
        name="document"
        size={24}
        color={Colors.primary}
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
      {!isMine && message.sent_by && (
        <Text style={styles.senderName}>{message.sent_by.prenom} {message.sent_by.nom}</Text>
      )}

      {renderAttachments()}

      {message.content && (
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
          {parseContent(message.content)}

          <Text style={styles.timestamp}>
            {formatDateTime(message.createdAt)}
            {isMine && (
              <>
                {message.read ? (
                  <Icon name="checkmark-done" size={14} color={Colors.primary} style={styles.readIcon} />
                ) : (
                  <Icon name="checkmark" size={14} color={Colors.darkGray} style={styles.readIcon} />
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
    marginVertical: 8,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 8,
    color: Colors.textSecondary,
    marginLeft: 8,
    marginBottom: 2,
  },
  bubble: {
    padding: 12,
    borderRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: Colors.lightGray
  },
  myBubble: {
    backgroundColor: Colors.lightGreen,
    borderTopRightRadius: 0,
  },
  otherBubble: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  linkText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.secondary,
    textDecorationLine: 'underline',
  },
  timestamp: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 8,
    color: Colors.textSecondary,
    alignSelf: 'flex-end',
    marginTop: 8,
    fontSize: 10,
  },
  readIcon: {
    marginLeft: 8,
  },
  attachmentsContainer: {
    marginBottom: 8,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  attachmentImage: {
    backgroundColor: Colors.lightGray,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textPrimary,
  },
  documentMeta: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 8,
    color: Colors.textSecondary,
  },
});

export default MessageBubble;