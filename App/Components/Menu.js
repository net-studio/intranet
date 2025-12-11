import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect, useState, useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../Context/AuthContext'
import Colors from '../Shared/Colors';
import useUnifiedNotifications from '../Hooks/useUnifiedNotifications';
import useNotificationsByType from '../Hooks/useNotificationsByType'; // ✅ Nouveau hook

export default function Menu() {
    const { userData, setUserData } = useContext(AuthContext);
    const { notificationCount } = useUnifiedNotifications();
    const { eventCount, agendaCount } = useNotificationsByType(); // ✅ Récupère les counts par type
    const path = useRoute().name;
    const navigation = useNavigation();

    const onPressHome = () => {
        navigation.navigate('home');
    }
    const onPressEquipe = () => {
        navigation.navigate('equipe');
    }
    const onPressActualite = () => {
        navigation.navigate('actualites');
    }
    const onPressAgenda = () => {
        navigation.navigate('agenda');
    }
    const onPressSettings = () => {
        navigation.navigate('Settings');
    }
    const onPressNotifications = () => {
        navigation.navigate('Notifications');
    }
    
    return (
        <View style={styles.topnav}>
            <TouchableOpacity onPress={() => onPressHome()} style={styles.icontext}>
                <Ionicons name="home" size={24} color={path == 'home' ? Colors.robine : 'black'} style={styles.nav} />
                <Text style={styles.small}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onPressEquipe()} style={styles.icontext}>
                <Ionicons name="people" size={24} color={path == 'equipe' ? Colors.robine : 'black'} style={styles.nav} />
                <Text style={styles.small}>Équipe</Text>
            </TouchableOpacity>

            {/* ✅ Info Robine avec badge */}
            <TouchableOpacity onPress={() => onPressActualite()} style={styles.icontext}>
                <View style={styles.iconContainer}>
                    <Ionicons 
                        name="newspaper-outline" 
                        size={24} 
                        color={path == 'actualites' ? Colors.robine : 'black'} 
                        style={styles.nav} 
                    />
                    {eventCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {eventCount > 99 ? '99+' : eventCount}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.small}>Info Robine</Text>
            </TouchableOpacity>

            {/* ✅ Info Équipe avec badge */}
            <TouchableOpacity onPress={() => onPressAgenda()} style={styles.icontext}>
                <View style={styles.iconContainer}>
                    <Ionicons 
                        name="calendar-number-outline" 
                        size={24} 
                        color={path == 'agenda' ? Colors.robine : 'black'} 
                        style={styles.nav} 
                    />
                    {agendaCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {agendaCount > 99 ? '99+' : agendaCount}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.small}>Info Équipe</Text>
            </TouchableOpacity>

            {/* Notifications avec badge */}
            <TouchableOpacity onPress={() => onPressNotifications()} style={styles.icontext}>
                <View style={styles.iconContainer}>
                    <Ionicons 
                        name="notifications-outline" 
                        size={24} 
                        color={path == 'Notifications' ? Colors.robine : 'black'} 
                        style={styles.nav} 
                    />
                    {notificationCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {notificationCount > 99 ? '99+' : notificationCount}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.small}>Notifs</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    small: {
        fontSize: 12,
    },
    img: {
        width: 26,
        height: 26,
        marginTop: 5,
    },
    nav: {
        paddingTop: 5,
    },
    icontext: {
        display: 'flex',
        alignItems: 'center',
        margin: 5,
        paddingVertical: 5,
        paddingHorizontal: 5,
    },
    topnav: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderRadius: 5,
        elevation: 2,
        backgroundColor: '#fff',
        marginTop: 5,
        marginRight: 5,
        marginBottom: 5,
        marginLeft: 5,
    },
    // ✅ Nouveaux styles pour les badges
    iconContainer: {
        position: 'relative',
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -10,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
})