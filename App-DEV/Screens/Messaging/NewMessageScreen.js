// src/screens/messaging/NewMessageScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  Keyboard,
  Switch
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import messagingService from '../../Shared/messagingService';
import SearchBar from '../../Components/Common/SearchBar';

const NewMessageScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [showGroupNameInput, setShowGroupNameInput] = useState(false);

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    loadUsers();
  }, []);

  // Rechercher à nouveau lorsque la requête change
  useEffect(() => {
    setPage(1);
    setUsers([]);
    setHasMore(true);
    loadUsers(true);
  }, [searchQuery]);

  // Charger les utilisateurs depuis l'API
  const loadUsers = async (refresh = false) => {
    if (loading && !refresh) return;
    
    try {
      setLoading(true);
      
      const newPage = refresh ? 1 : page;
      const result = await messagingService.searchUsers(searchQuery, newPage);
      
      if (refresh) {
        setUsers(result.data);
      } else {
        setUsers(prevUsers => [...prevUsers, ...result.data]);
      }
      
      setPage(newPage + 1);
      setHasMore(result.meta?.pagination?.page < result.meta?.pagination?.pageCount);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer la sélection d'un utilisateur
  const toggleUserSelection = (user) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      // Désélectionner l'utilisateur
      setSelectedUsers(prevSelected => prevSelected.filter(u => u.id !== user.id));
    } else {
      // Sélectionner l'utilisateur
      setSelectedUsers(prevSelected => [...prevSelected, user]);
    }
    
    // Si plus d'un utilisateur est sélectionné, montrer l'option de groupe
    if (selectedUsers.length > 0) {
      setShowGroupNameInput(true);
    } else {
      setShowGroupNameInput(false);
      setIsGroupChat(false);
    }
  };

  // Créer une nouvelle conversation
  const createConversation = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un utilisateur');
      return;
    }
    
    try {
      setIsCreatingConversation(true);
      
      // Récupérer les IDs des utilisateurs sélectionnés
      const participantIds = selectedUsers.map(user => user.id);
      
      // Créer une conversation (groupe ou individuelle)
      const isGroup = selectedUsers.length > 1 || isGroupChat;
      const name = isGroup ? (groupName || `Groupe (${selectedUsers.length + 1})`) : null;
      
      const conversation = await messagingService.createConversation(
        participantIds,
        name,
        isGroup
      );
      
      // Naviguer vers la conversation créée
      navigation.replace('ChatRoom', { conversation });
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      Alert.alert('Erreur', 'Impossible de créer la conversation. Veuillez réessayer.');
    } finally {
      setIsCreatingConversation(false);
    }
  };
  
  // Rendu d'un élément utilisateur
  const renderUserItem = ({ item }) => {
    const isSelected = selectedUsers.some(user => user.id === item.id);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => toggleUserSelection(item)}
      >
        <View style={styles.userAvatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        
        <View style={styles.checkboxContainer}>
          {isSelected && (
            <Icon name="checkmark-circle" size={24} color={COLORS.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // Rendu de la barre des utilisateurs sélectionnés
  const renderSelectedUsersBar = () => {
    if (selectedUsers.length === 0) return null;
    
    return (
      <View style={styles.selectedUsersContainer}>
        <FlatList
          data={selectedUsers}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.selectedUser}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.selectedUserAvatar} />
              ) : (
                <View style={styles.selectedUserDefaultAvatar}>
                  <Text style={styles.selectedUserInitial}>
                    {item.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              
              <Text style={styles.selectedUserName} numberOfLines={1}>
                {item.username}
              </Text>
              
              <TouchableOpacity
                style={styles.removeSelectedUser}
                onPress={() => toggleUserSelection(item)}
              >
                <Icon name="close-circle" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  };
  
  // Rendu du formulaire de nom de groupe
  const renderGroupNameInput = () => {
    if (!showGroupNameInput || selectedUsers.length === 0) return null;
    
    return (
      <View style={styles.groupNameContainer}>
        <Text style={styles.groupNameLabel}>Nom du groupe (optionnel):</Text>
        <View style={styles.groupNameInputContainer}>
          <TextInput
            style={styles.groupNameInput}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Entrez le nom du groupe..."
            placeholderTextColor={COLORS.darkGray}
          />
          <Switch
            value={isGroupChat}
            onValueChange={setIsGroupChat}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '80' }}
            thumbColor={isGroupChat ? COLORS.primary : COLORS.white}
          />
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Nouveau message</Text>
        
        <TouchableOpacity
          style={[
            styles.createButton,
            (!selectedUsers.length || isCreatingConversation) && styles.disabledButton
          ]}
          onPress={createConversation}
          disabled={!selectedUsers.length || isCreatingConversation}
        >
          {isCreatingConversation ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.createButtonText}>Créer</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <SearchBar
        placeholder="Rechercher un utilisateur..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        style={styles.searchBar}
        loading={loading && page === 1}
      />
      
      {renderSelectedUsersBar()}
      {renderGroupNameInput()}
      
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.userList}
        onEndReached={() => hasMore && loadUsers()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.loadingFooter} />
          ) : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Icon name="search" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? `Aucun résultat pour "${searchQuery}"`
                  : 'Recherchez et sélectionnez des utilisateurs'
                }
              </Text>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.sm,
  },
  disabledButton: {
    backgroundColor: COLORS.primary + '80',
  },
  createButtonText: {
    ...FONTS.body2,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  searchBar: {
    marginHorizontal: SIZES.lg,
    marginVertical: SIZES.md,
  },
  userList: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    backgroundColor: COLORS.white,
    marginBottom: SIZES.sm,
    borderRadius: SIZES.sm,
    ...NEUMORPHISM.normal,
  },
  selectedUserItem: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  userAvatarContainer: {
    marginRight: SIZES.md,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  userEmail: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  checkboxContainer: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    paddingVertical: SIZES.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
  },
  emptyText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.md,
  },
  selectedUsersContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedUser: {
    alignItems: 'center',
    marginHorizontal: SIZES.xs,
    width: 70,
  },
  selectedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: SIZES.xs,
  },
  selectedUserDefaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  selectedUserInitial: {
    ...FONTS.body2,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  selectedUserName: {
    ...FONTS.body4,
    color: COLORS.textPrimary,
    maxWidth: 65,
  },
  removeSelectedUser: {
    position: 'absolute',
    top: -5,
    right: 5,
    backgroundColor: COLORS.white,
    borderRadius: 10,
  },
  groupNameContainer: {
    padding: SIZES.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  groupNameLabel: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  groupNameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupNameInput: {
    flex: 1,
    ...FONTS.body2,
    color: COLORS.textPrimary,
    padding: SIZES.sm,
    backgroundColor: COLORS.lightBackground,
    borderRadius: SIZES.sm,
    marginRight: SIZES.md,
  }
});

export default NewMessageScreen;