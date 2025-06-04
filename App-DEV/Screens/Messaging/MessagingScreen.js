// src/screens/messaging/MessagingScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import messagingService from '../../Shared/messagingService';

// Composants
import ConversationItem from '../../Components/Messaging/ConversationItem';
import SearchBar from '../../Components/Common/SearchBar';

const MessagingScreen = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await messagingService.fetchConversations();
        setConversations(data);
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Filtrer les conversations en fonction de la recherche
  const filteredConversations = conversations.filter(
    convo =>
      convo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (convo.lastMessage && convo.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.titleContainer}>
          <Icon name="chatbubble-ellipses" size={28} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <TouchableOpacity style={styles.newMessageButton} onPress={() => navigation.navigate('NewMessage')}>
          <Icon name="add-circle" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={COLORS.darkGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={COLORS.darkGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, styles.activeTab]}
          onPress={() => { }}
        >
          <Text style={styles.activeTabText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigation.navigate('TeamChats')}
        >
          <Text style={styles.tabText}>Groupes de Chats</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Exemple de rendu du composant ConversationItem
  const renderConversation = ({ item }) => (
    <ConversationItem
      avatar={item.avatar}
      name={item.name}
      message={item.lastMessage}
      time={item.timestamp}
      unread={item.unreadCount}
      isOnline={item.isOnline}
      onPress={() => navigation.navigate('ChatRoom', { conversation: item })}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {renderHeader()}

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>Chargement...</Text>
          ) : (
            <Text style={styles.emptyText}>Aucune conversation trouvée</Text>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.background,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginLeft: SIZES.sm,
  },
  newMessageButton: {
    padding: SIZES.xs,
  },
  searchContainer: {
    marginBottom: SIZES.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    ...NEUMORPHISM.light,
  },
  searchIcon: {
    marginRight: SIZES.sm,
  },
  searchInput: {
    flex: 1,
    ...FONTS.body1,
    color: COLORS.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginVertical: SIZES.sm,
  },
  tab: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    marginRight: SIZES.md,
    borderRadius: SIZES.sm,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    ...NEUMORPHISM.light,
  },
  tabText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
  },
  activeTabText: {
    ...FONTS.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xxxl,
  },
  emptyText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.xxxl,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  footerTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
});

export default MessagingScreen;
