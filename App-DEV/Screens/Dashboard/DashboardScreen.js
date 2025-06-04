// src/screens/dashboard/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import dataService from '../../Shared/dataService';
import { useNotifications } from '../../Hooks/useNotifications';

// Composants
import NotificationBadge from '../../Components/Common/NotificationBadge';
import QuickActionButton from '../../Components/Dashboard/QuickActionButton';
import NewsCard from '../../Components/Dashboard/NewsCard';
import StatCard from '../../Components/Dashboard/StatCard';
import EventPreview from '../../Components/Dashboard/EventPreview';

const DashboardScreen = () => {
    const navigation = useNavigation();
    const { notificationCount } = useNotifications();
    const [recentDocs, setRecentDocs] = useState([]);
    const [companyNews, setCompanyNews] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    // useEffect(() => {
    //     // Charger les données depuis Strapi
    //     const loadDashboardData = async () => {
    //         try {
    //             const docs = await dataService.fetchRecentDocs();
    //             setRecentDocs(docs);

    //             try {
    //                 const news = await dataService.fetchCompanyNews();
    //                 setCompanyNews(news);
    //             } catch (newsError) {
    //                 console.error('Erreur lors du chargement des news:', newsError);
    //                 // Fallback à la méthode fetch si nécessaire
    //                 const newsResponse = await fetch('/api/company-news').then(r => r.json());
    //                 setCompanyNews(newsResponse);
    //             }

    //             try {
    //                 const events = await dataService.fetchUpcomingEvents();
    //                 setUpcomingEvents(events);
    //             } catch (eventsError) {
    //                 console.error('Erreur lors du chargement des événements:', eventsError);
    //                 // Fallback à la méthode fetch si nécessaire
    //                 const eventsResponse = await fetch('/api/events').then(r => r.json());
    //                 setUpcomingEvents(eventsResponse);
    //             }
    //         } catch (error) {
    //             console.error('Erreur lors du chargement des données du tableau de bord:', error);
    //         }
    //     };

    //     loadDashboardData();
    // }, []);
    useEffect(() => {
        // Charger les données depuis Strapi
        const loadDashboardData = async () => {
            // Fonction utilitaire de secours qui renvoie un tableau vide en cas d'erreur
            const safeApiCall = async (apiFunction, fallbackData = []) => {
                try {
                    return await apiFunction();
                } catch (error) {
                    console.error(`Erreur lors de l'appel API: ${error.message}`);
                    return fallbackData;
                }
            };

            // Récupérer les documents récents
            const docs = await safeApiCall(dataService.fetchRecentDocs);
            setRecentDocs(docs);
            // Récupérer les actualités
            const news = await safeApiCall(dataService.fetchCompanyNews);
            setCompanyNews(news);

            // Récupérer les événements à venir
            // const events = await safeApiCall(dataService.fetchUpcomingEvents);
            // setUpcomingEvents(events);
        };

        loadDashboardData();
    }, []);

    // Quick action icons basés sur votre maquette
    const quickActions = [
        { icon: 'chatbubble-outline', name: 'Chat', screen: 'Messaging' },
        { icon: 'person-outline', name: 'Profile', screen: 'Profile' },
        { icon: 'calendar-outline', name: 'Calendar', screen: 'Calendar' },
        { icon: 'document-text-outline', name: 'Documents', screen: 'Documents' },
        { icon: 'settings-outline', name: 'Settings', screen: 'Settings' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../Assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <View style={styles.titleContainer}>
                        <Text style={styles.subTitle}>Tableau de bord</Text>
                        <Text style={styles.title}>Intranet d'Entreprise</Text>

                    </View>
                </View>
                {/* <View style={styles.quickIcons}>
                    {quickActions.slice(0, 5).map((action, index) => (
                        <QuickActionButton
                            key={index}
                            icon={action.icon}
                            onPress={() => navigation.navigate(action.screen)}
                            color={index === 2 ? COLORS.primary : COLORS.secondary}
                        />
                    ))}
                </View> */}
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Documents récents et notifications */}
                <View style={styles.statsContainer}>
                    <StatCard
                        title="Documents"
                        count={recentDocs.length || 0}
                        icon="document"
                        color={COLORS.primary}
                        onPress={() => navigation.navigate('DocumentsTab')}
                    />
                    <StatCard
                        title="Notifications"
                        count={notificationCount || 0}
                        icon="notifications"
                        color={COLORS.secondary}
                        onPress={() => navigation.navigate('Notifications')}
                    />
                </View>

                {/* Accès rapides */}
                <View style={styles.quickAccessContainer}>
                    <TouchableOpacity
                        style={[styles.quickAccessButton, { backgroundColor: COLORS.lightGray }]}
                        onPress={() => navigation.navigate('DocumentsTab')}
                    >
                        <Icon name="document-text" size={20} color={COLORS.darkGray} />
                        <Text style={styles.quickAccessText}>Documents</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickAccessButton, { backgroundColor: COLORS.primary }]}
                        onPress={() => navigation.navigate('CompanyBlog')}
                    >
                        <Icon name="newspaper" size={20} color={COLORS.white} />
                        <Text style={[styles.quickAccessText, { color: COLORS.white }]}>
                            Company Blog
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Actualités de l'entreprise */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Icon name="business" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Actualités</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AllNews')}>
                            <Icon name="arrow-forward-circle" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Carte de nouvelles */}
                    <NewsCard
                        title="Communications"
                        subtitle="Newsletter"
                        date="Yesterday"
                        image={require('../../Assets/images/newspaper-outline.svg')}
                        onPress={() => navigation.navigate('NewsDetail', { id: 1 })}
                    />
                </View>

                {/* Événements à venir */}
                <View style={styles.eventsContainer}>
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={styles.eventCard}
                            onPress={() => navigation.navigate('CompanyEvents')}
                        >
                            <View style={styles.eventIconContainer}>
                                <Icon name="people" size={24} color={COLORS.secondary} />
                            </View>
                            <Text style={styles.eventTitle}>Evènements</Text>
                            <Text style={styles.eventSubtitle}>5 upcoming</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.eventCard}
                            onPress={() => navigation.navigate('UpcomingEvents')}
                        >
                            <View style={styles.eventIconContainer}>
                                <Icon name="calendar" size={24} color={COLORS.secondary} />
                            </View>
                            <Text style={styles.eventTitle}>A venir</Text>
                            <Text style={styles.eventSubtitle}>3 upcoming</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.eventCard, { backgroundColor: COLORS.primary }]}
                            onPress={() => navigation.navigate('CalendarTab')}
                        >
                            <View style={[styles.eventIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Icon name="star" size={24} color={COLORS.white} />
                            </View>
                            <Text style={[styles.eventTitle, { color: COLORS.white }]}>Agenda</Text>
                            <Text style={[styles.eventSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                                15 meetings
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.eventCard, { backgroundColor: COLORS.darkBackground }]}
                            onPress={() => navigation.navigate('HRTab')}
                        >
                            <View style={[styles.eventIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Icon name="briefcase" size={24} color={COLORS.white} />
                            </View>
                            <Text style={[styles.eventTitle, { color: COLORS.white }]}>Infos RH</Text>
                            <Text style={[styles.eventSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                                Actualités & Annonces
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: SIZES.md,
        paddingBottom: SIZES.xs,
        paddingHorizontal: SIZES.md,
        backgroundColor: COLORS.white,
        borderRadius: 5,
        display: 'flex',
        justifyContent: 'space-between'
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: SIZES.md,
    },
    title: {
        ...FONTS.h3,
        color: COLORS.primary,
        marginBottom: 0,
    },
    header: {
        paddingHorizontal: SIZES.lg,
        paddingTop: SIZES.lg,
        paddingBottom: SIZES.md,
    },
    titleContainer: {
        display: 'flex',
        alignItems: 'flex-end',
    },
    subTitle: {
        fontSize: SIZES.md,
        fontWeight: 600,
        color: COLORS.textPrimary,
    },
    quickIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SIZES.sm,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: SIZES.lg,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: SIZES.md,
    },
    quickAccessContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SIZES.lg,
    },
    quickAccessButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SIZES.sm,
        paddingHorizontal: SIZES.md,
        borderRadius: SIZES.sm,
        flex: 1,
        marginHorizontal: 5,
        ...NEUMORPHISM.light,
    },
    quickAccessText: {
        ...FONTS.body2,
        marginLeft: SIZES.xs,
    },
    sectionContainer: {
        marginBottom: SIZES.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.sm,
    },
    sectionTitle: {
        ...FONTS.h4,
        color: COLORS.textPrimary,
        flex: 1,
        marginLeft: SIZES.xs,
    },
    eventsContainer: {
        marginBottom: SIZES.xxl,
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    eventCard: {
        width: '48%',
        padding: SIZES.md,
        borderRadius: SIZES.md,
        backgroundColor: COLORS.white,
        marginBottom: SIZES.md,
        ...NEUMORPHISM.light,
    },
    eventIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.sm,
    },
    eventTitle: {
        ...FONTS.h4,
        color: COLORS.textPrimary,
    },
    eventSubtitle: {
        ...FONTS.body2,
        color: COLORS.textSecondary,
        marginTop: 4,
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

export default DashboardScreen;