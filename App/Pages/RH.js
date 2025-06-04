// src/screens/hr/HRScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../Shared/Theme';
import { hrService } from '../Shared/strapiService';
import Menu from '../Components/Menu';
import WelcomeHeader from '../Components/WelcomeHeader';
import { AuthContext } from '../Context/AuthContext';
import GlobalApi from '../Shared/GlobalApi';

const RH = () => {
  const { userData, setUserData } = useContext(AuthContext);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [salarySlips, setSalarySlips] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [hrPolicies, setHRPolicies] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadHRData();
  }, []);

  const loadHRData = async () => {
    try {
      setLoading(true);

      // Charger les données RH en parallèle
      const [slipsResponse, requestsResponse, policiesResponse, profileResponse] = await Promise.all([
        hrService.getSalarySlips(userData),
        hrService.getLeaveRequests(userData),
        hrService.getHRPolicies(),
        hrService.getEmployeeInfo(userData),
      ]);

      setSalarySlips(slipsResponse);
      setLeaveRequests(requestsResponse);
      setHRPolicies(policiesResponse);
      setUserProfile(profileResponse);
    } catch (error) {
      console.error('Erreur lors du chargement des données RH:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rendu du header avec l'illustration du bureau RH
  const renderHROfficeSection = () => (
    <View style={styles.hrOfficeSection}>
      <View style={styles.hrOfficeImageContainer}>
        <Image
          source={require('../Assets/images/people-circle-outline.svg')}
          style={styles.hrOfficeImage}
          resizeMode="contain"
        />
        <View style={styles.hprBadge}>
          <Text style={styles.hprText}>RH</Text>
        </View>
      </View>
    </View>
  );

  // Rendu de la section des bulletins de salaire et demandes de congés
  const renderSalaryLeaveSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionCard}
        onPress={() => navigation.navigate('SalarySlips')}
      >
        <View style={styles.sectionIconContainer}>
          <Icon name="document-text" size={24} color={COLORS.white} />
        </View>
        <View>
          <Text style={styles.sectionTitle}>Bulletins de salaire</Text>
          <Text style={styles.sectionSubtitle}>
            {salarySlips.length > 0
              ? `${salarySlips.length} disponibles`
              : 'Aucun bulletin'
            }
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sectionCard, { backgroundColor: COLORS.white }]}
        onPress={() => navigation.navigate('LeaveRequests')}
      >
        <View style={[styles.sectionIconContainer, { backgroundColor: COLORS.secondary }]}>
          <Icon name="calendar" size={24} color={COLORS.white} />
        </View>
        <View>
          <Text style={styles.sectionTitle}>Demandes de congés</Text>
          <Text style={styles.sectionSubtitle}>
            {leaveRequests.filter(req => req.statut === 'pending').length > 0
              ? `${leaveRequests.filter(req => req.statut === 'pending').length} en attente`
              : 'Aucune demande en attente'
            }
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Rendu de la section des politiques RH
  const renderPoliciesSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionCard}
        onPress={() => navigation.navigate('HRPolicies')}
      >
        <View style={styles.policyIconContainer}>
          <Icon name="document" size={24} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.sectionTitle}>Politiques RH</Text>
          <Text style={styles.sectionSubtitle}>
            {hrPolicies.length > 0
              ? `${hrPolicies.length} documents`
              : 'Aucune politique'
            }
          </Text>
        </View>
      </TouchableOpacity>

      {/* <TouchableOpacity
        style={[styles.sectionCard, { backgroundColor: COLORS.darkBackground }]}
        onPress={() => navigation.navigate('HRNotices')}
      >
        <View>
          <Text style={[styles.sectionTitle, { color: COLORS.white }]}>Infos RH</Text>
          <Text style={[styles.sectionSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>
            Actualités &amp; Annonces
          </Text>
        </View>
      </TouchableOpacity> */}
    </View>
  );

  // Rendu des boutons du bas
  const renderBottomButtons = () => (
    <View style={styles.bottomButtons}>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Salary')}
      >
        <View style={styles.hraButtonContent}>
          <View style={styles.hraIconContainer}>
            <Icon name="cash-outline" size={20} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.primaryButtonText}>Salaire</Text>
        </View>
        <Text style={styles.secondaryButtonSubtext}>Rémunération</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('HRPolicies')}
      >
        <View style={styles.hraButtonContent}>
          <View style={styles.hraIconContainer}>
            <Icon name="briefcase" size={20} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.secondaryButtonText}>Règlement</Text>
        </View>
        <Text style={styles.secondaryButtonSubtext}>Documents officiels</Text>
      </TouchableOpacity>
    </View>
  );

  // Rendu du profil utilisateur
  const renderUserProfile = () => {
    if (!userProfile) return null;

    return (
      <View style={styles.profileContainer}>
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.profileAvatarContainer}>
            {userProfile.photo ? (
              <Image source={{ uri: GlobalApi.API_URL + userProfile.photo?.url }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileDefaultAvatar}>
                <Text style={styles.profileInitials}>
                  {userProfile.prenom?.charAt(0) || ''}
                  {userProfile.nom?.charAt(0) || ''}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userProfile.prenom} {userProfile.nom}
            </Text>
            <Text style={styles.profileJobTitle}>
              {userProfile.jobTitle}
            </Text>
            <Text style={styles.profileDepartment}>
              {userProfile.department}
            </Text>
          </View>

          <Icon name="chevron-forward" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RH</Text>
          <Text style={styles.headerSubtitle}>Mobile Intranet</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des données RH...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      <WelcomeHeader />
      <View style={styles.header}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.headerTitle}>RH</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="notifications" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate('Messaging')}
            >
              <Icon name="mail" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate('Profile')}
            >
              <Icon name="person" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate('Settings')}
            >
              <Icon name="settings" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
        {/* <Text style={styles.headerSubtitle}>Mobile Intranet</Text> */}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderUserProfile()}
        {renderHROfficeSection()}
        {renderSalaryLeaveSection()}
        {renderPoliciesSection()}
        {/* {renderBottomButtons()} */}
      </ScrollView>
      <Menu />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.secondary,
    paddingTop: SIZES.lg,
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.white,
  },
  headerSubtitle: {
    ...FONTS.body2,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 0,
  },
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: SIZES.md,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  profileContainer: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    ...NEUMORPHISM.light,
  },
  profileAvatarContainer: {
    marginRight: SIZES.md,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileDefaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  profileJobTitle: {
    ...FONTS.body2,
    color: COLORS.primary,
  },
  profileDepartment: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  hrOfficeSection: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.lg,
  },
  hrOfficeImageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    ...NEUMORPHISM.light,
    overflow: 'hidden',
  },
  hrOfficeImage: {
    width: '100%',
    height: '100%',
  },
  hprBadge: {
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.md,
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.sm,
  },
  hprText: {
    ...FONTS.body2,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  section: {
    // flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.lg,
    gap: SIZES.md
  },
  sectionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    padding: SIZES.xxxl,
    marginHorizontal: SIZES.xs,
    ...NEUMORPHISM.light,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  policyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    marginVertical: SIZES.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    ...NEUMORPHISM.light,
  },
  primaryButtonText: {
    ...FONTS.h4,
    color: COLORS.secondary,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    ...NEUMORPHISM.light,
  },
  hraButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hraIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.xs,
  },
  secondaryButtonText: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  secondaryButtonSubtext: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 30,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  footerTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
});

export default RH;