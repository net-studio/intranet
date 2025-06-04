import { View, Text, StyleSheet, Image, ScrollView, SafeAreaView, TouchableOpacity, Platform } from 'react-native'
import React, { useState, useEffect, useContext } from 'react'
import Colors from '../Shared/Colors';
import Menu from '../Components/Menu';
import StatCard from '../Components/StatCard';
import GlobalApi from '../Shared/GlobalApi';
import useUnifiedNotifications from '../Hooks/useUnifiedNotifications';
import Icon from 'react-native-vector-icons/Ionicons';
import { documentService } from '../Shared/strapiService';
import { AuthContext } from '../Context/AuthContext'
import { useNavigation } from '@react-navigation/native';

export default function Dashboard() {

    const navigation = useNavigation();
    const { userData, setUserData } = useContext(AuthContext);
    const { notificationCount } = useUnifiedNotifications();
    const [recentDocs, setRecentDocs] = useState([]);
    const [actus, setActus] = useState([]);
    const [lastActu, setLastActu] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState([]);

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

            // // Récupérer les documents récents
            const docs = await documentService.fetchRecentDocs(userData.documentId);
            setRecentDocs(docs);

            const messages = await GlobalApi.getUnreadMessages(userData.documentId);
            setUnreadMessages(messages.data.data);

            // // Récupérer les actualités
            const news = await GlobalApi.getActualites(1);
            setActus(news.data.data);

            // Récupérer les événements à venir
            // const events = await safeApiCall(dataService.fetchUpcomingEvents);
            // setUpcomingEvents(events);

            const actu = (await GlobalApi.getLastActualite()).data;
            const resp = actu.data.map((item) => ({
                id: item.id,
                documentId: item.documentId,
                titre: item.titre,
                soustitre: item.soustitre,
                texte: item.texte,
                images: item.medias,
                position: item.position,
                createdAt: item.createdAt,
            }))
            setLastActu(resp);
        };

        loadDashboardData();
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../Assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <View style={styles.titleContainer}>
                        <Text style={styles.subTitle}>Tableau de bord</Text>
                        <Text style={styles.title}>Intranet d'Entreprise</Text>

                    </View>
                </View>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.eventsContainer}>

                        {/* Documents récents et notifications */}
                        <View style={styles.row}>
                            <StatCard
                                title="Documents"
                                count={recentDocs.length || 0}
                                icon="document"
                                color={Colors.primary}
                                onPress={() => navigation.navigate('docs')}
                            />
                            <StatCard
                                title="Notifications"
                                count={notificationCount || 0}
                                icon="notifications"
                                color={Colors.secondary}
                                onPress={() => navigation.navigate('Notifications')}
                            />
                        </View>

                        {/* Événements à venir */}
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={styles.eventCard}
                                onPress={() => navigation.navigate('chat')}
                            >
                                <View style={styles.eventIconContainer}>
                                    <Icon name="chatbubble-outline" size={24} color={Colors.secondary} />
                                </View>
                                <Text style={styles.eventTitle}>Messages</Text>
                                <Text style={styles.eventSubtitle}>{`${unreadMessages.length} non lus`}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.eventCard}
                                onPress={() => navigation.navigate('Settings')}
                            >
                                <View style={styles.eventIconContainer}>
                                    <Icon name="settings-outline" size={24} color={Colors.secondary} />
                                </View>
                                <Text style={styles.eventTitle}>Paramètres</Text>
                                <Text style={styles.eventSubtitle}>Configuration & Réglages</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.infoLarge}
                            onPress={() => navigation.navigate('actualites')}
                        >
                            <View>
                                <View style={styles.eventIconContainer}>
                                    <Icon name="newspaper" size={24} color={Colors.secondary} />
                                </View>
                                <Text style={styles.eventTitle}>Actualités</Text>
                                <Text style={styles.eventSubtitle}>{actus.length || 0} actus</Text>
                            </View>
                            <View>
                                <Text>{lastActu[0]?.titre}</Text>
                                {lastActu[0]?.images[0]?.url !== undefined ?
                                    <Image
                                        source={{ uri: GlobalApi.API_URL + lastActu[0]?.images[0]?.url }}
                                        style={{ position: 'absolute', borderRadius: 5, display: 'block', width: '100%', height: '100%' }}
                                    />
                                    : null}
                            </View>
                        </TouchableOpacity>

                        {/* Agenda & RH */}
                        <View style={[styles.row, { paddingBottom: 16 }]}>
                            {/* <TouchableOpacity
                                style={styles.eventCard}
                                onPress={() => navigation.navigate('agenda')}
                            >
                                <View style={styles.eventIconContainer}>
                                    <Icon name="people" size={24} color={Colors.secondary} />
                                </View>
                                <Text style={styles.eventTitle}>Evènements</Text>
                                <Text style={styles.eventSubtitle}>5 upcoming</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.eventCard}
                                onPress={() => navigation.navigate('agenda')}
                            >
                                <View style={styles.eventIconContainer}>
                                    <Icon name="calendar" size={24} color={Colors.secondary} />
                                </View>
                                <Text style={styles.eventTitle}>A venir</Text>
                                <Text style={styles.eventSubtitle}>3 upcoming</Text>
                            </TouchableOpacity> */}
                            <TouchableOpacity
                                style={[styles.eventCard, { backgroundColor: Colors.primary }]}
                                onPress={() => navigation.navigate('agenda')}
                            >
                                <View style={[styles.eventIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <Icon name="star" size={24} color={Colors.white} />
                                </View>
                                <Text style={[styles.eventTitle, { color: Colors.white }]}>Agenda</Text>
                                <Text style={[styles.eventSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                                    15 meetings
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.eventCard, { backgroundColor: Colors.darkBackground }]}
                                onPress={() => navigation.navigate('rh')}
                            >
                                <View style={[styles.eventIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <Icon name="briefcase" size={24} color={Colors.white} />
                                </View>
                                <Text style={[styles.eventTitle, { color: Colors.white }]}>Infos RH</Text>
                                <Text style={[styles.eventSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                                    Actualités & Annonces
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
            <Menu />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
    },
    eventsContainer: {
        flex: 1,
        gap: 20,
        paddingVertical: 16,
        paddingHorizontal: 8,
        justifyContent: 'space-around',
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        flexGrow: 1,
    },
    infoLarge: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: Colors.white,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexGrow: 1,
    },
    eventCard: {
        width: '48%',
        padding: 16,
        borderRadius: 8,
        backgroundColor: Colors.white,
    },
    eventIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventTitle: {
        fontFamily: 'System',
        fontWeight: '600',
        fontSize: 20,
        color: Colors.textPrimary,
    },
    eventSubtitle: {
        fontFamily: 'System',
        fontWeight: '400',
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 6,
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        color: Colors.robine,
        marginBottom: 0,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: 600,
        color: Colors.black,
    },
    titleContainer: {
        display: 'flex',
        alignItems: 'flex-end',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 16,
        marginHorizontal: 8,
        backgroundColor: Colors.white,
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        ...Platform.select({
            ios: {
                marginBottom: 12,
            },
            android: {
                marginBottom: 12,
            },
            default: {
                marginTop: 6,
                marginBottom: 4,
            },
        }),
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: 16,
    },
    footer: {
        flex: 1,
        justifyContent: 'flex-end'
    },
})