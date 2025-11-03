import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect, useState, useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../Context/AuthContext'
import Colors from '../Shared/Colors';

export default function Menu() {
    const { userData, setUserData } = useContext(AuthContext);
    const path = useRoute().name;
    const navigation = useNavigation();
    const [adherent, setAdherent] = useState([]);

    useEffect(() => {
        setAdherent(userData);
    }, [])

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
            <TouchableOpacity onPress={() => onPressActualite()} style={styles.icontext}>
                <Ionicons name="newspaper-outline" size={24} color={path == 'actualites' ? Colors.robine : 'black'} style={styles.nav} />
                <Text style={styles.small}>Info Robine</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onPressAgenda()} style={styles.icontext}>
                <Ionicons name="calendar-number-outline" size={24} color={path == 'agenda' ? Colors.robine : 'black'} style={styles.nav} />
                <Text style={styles.small}>Info Équipe</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onPressNotifications()} style={styles.icontext}>
                <Ionicons name="notifications-outline" size={24} color={path == 'Notifications' ? Colors.robine : 'black'} style={styles.nav} />
                <Text style={styles.small}>Notifs</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={() => onPressSettings()} style={styles.icontext}>
                <Ionicons name="settings-outline" size={24} color={path == 'Settings' ? Colors.robine : 'black'} style={styles.nav} />
                <Text style={styles.small}>Config</Text>
            </TouchableOpacity> */}
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
})