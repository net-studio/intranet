import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useContext, useEffect } from 'react'
import { AuthContext } from '../Context/AuthContext'
import Ionicons from '@expo/vector-icons/Ionicons';
import Services from '../Shared/Services';
import { useNavigation } from '@react-navigation/native';
import GlobalApi from '../Shared/GlobalApi'

export default function WelcomeHeader() {
    const { userData, setUserData } = useContext(AuthContext);
    const navigation = useNavigation();

    const onPressLogout = async () => {
        await Services.Logout();
        setUserData();
        navigation.navigate('home');
    }

    const onPressHome = () => {
        navigation.navigate('home');
    }

    const onPressCollaborateur = () => {
        navigation.navigate('Profile');
    }

    useEffect(() => {
    }, [userData])

    return (
        <View style={styles.container}>
            <View style={styles.topnav}>
                <TouchableOpacity onPress={() => onPressLogout()}>
                    <Ionicons name="power-sharp" size={24} color="black" />
                    <Text style={styles.small}>v1.0.6</Text>
                </TouchableOpacity>
                <View>
                    <Text>Hello,</Text>
                    <TouchableOpacity onPress={() => onPressHome()}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{userData?.prenom}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => onPressCollaborateur()}>
                    <Image source={{ uri: GlobalApi.API_URL + userData?.image }} style={{ width: 40, height: 40, borderRadius: 100 }} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    small: {
        fontSize: 11,
    },
    topnav: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 5,
        elevation: 2,
        backgroundColor: '#fff',
        margin: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    container: {
        display: 'flex',
    }
})