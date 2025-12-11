import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import Colors from '../Shared/Colors'
import { AuthContext } from '../Context/AuthContext';
import Services from '../Shared/Services';
import GlobalApi from '../Shared/GlobalApi';
import { sha256 } from 'js-sha256';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hidePassword, setHidePassword] = useState(true);

    const [loginErr, setloginErr] = useState('');
    const { userData, setUserData } = useContext(AuthContext);

    const togglePassword = () => {
        setHidePassword(!hidePassword);
    }

    // console.log(sha256("RobineIntranet"));

    const handleLogin = async () => {
        try {
            const result = (await GlobalApi.getLogin(email)).data;
            const resp = result.data.map((item) => ({
                id: item.id,
                documentId: item.documentId,
                prenom: item.prenom,
                nom: item.nom,
                telephone: item.telephone,
                email: item.email,
                password: item.password,
                image: item.photo?.url,
            }));

            const hash = sha256(password);

            if (email != resp[0].email || hash != resp[0].password) {
                setloginErr('Problème de connexion : Login ou mot de passe incorrect');
            } else if (email == resp[0].email && hash == resp[0].password) {
                await Services.setUserAuth(resp[0]);
                await Services.setDocumentId(resp[0].documentId);
                await setUserData(resp[0]);
            } else {
                setloginErr('');
            }

        // // Une fois l'utilisateur connecté, enregistrer son token FCM
        // const fcmToken = await getFCMToken();
        // if (fcmToken) {
        // await registerFCMToken(fcmToken, userData.documentId);
        // }

        } catch (error) {
            console.error("Error during login:", error);
        }
    };

    useEffect(() => {

    }, [])

    return (
        <View style={styles.main}>
            <View style={styles.container}>
                <View style={styles.fluid}>
                    <Image style={styles.img} source={require('../Assets/robine-intranet.svg')} />
                </View>
            </View>
            <View style={styles.container}>
                <Text style={styles.title}>Connexion Collaborateur</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    onChangeText={(text) => setEmail(text.toLowerCase().trim())}
                    value={email}
                    onSubmitEditing={() => { this.getPassword.focus(); }}
                />
                <View>
                    <TextInput
                        style={styles.input}
                        placeholder="Mot de passe"
                        placeholderTextColor="#888"
                        onChangeText={(text) => setPassword(text)}
                        value={password}
                        secureTextEntry={hidePassword}
                    // ref={(input) => { this.getPassword = input; }}
                    />
                    <TouchableOpacity onPress={() => togglePassword()} style={styles.eye}>
                        {hidePassword ? <Ionicons name="eye-outline" size={24} color="grey" /> : <Ionicons name="eye-off-outline" size={24} color="grey" />}
                    </TouchableOpacity>
                </View>
                <Text style={styles.error}>{loginErr}</Text>
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={{ color: Colors.white }}>Connexion</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.versioning}><Text style={styles.small}>v1.0.7</Text></View>
        </View>
    )
}

const styles = StyleSheet.create({
    eye: {
        marginHorizontal: 0,
        marginVertical: 0,
        paddingHorizontal: 0,
        paddingVertical: 0,
        backgroundColor: 'transparent',
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
        height: 'auto',
        position: 'absolute',
        right: '0.5rem',
        top: '0.5rem'
    },
    main: {
        flex: 1,
        marginTop: 20,
    },
    small: {
        fontSize: 11,
    },
    versioning: {
        padding: 5,
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end'
    },
    img: {
        marginTop: 0,
        marginBottom: 0,
        width: '100%',
        height: '100%',
        position: 'absolute'
    },
    fluid: {
        width: '100%',
        paddingHorizontal: 10,
        paddingBottom: 'calc(3/16 * 100%)',
    },
    container: {
        flex: 1,
        alignItems: "center",
    },
    title: {
        color: Colors.black,
        fontSize: 24,
        marginBottom: 20,
    },
    error: {
        color: Colors.error,
    },
    input: {
        width: 300,
        height: 40,
        borderColor: Colors.border,
        backgroundColor: Colors.bginput,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    button: {
        color: Colors.white,
        backgroundColor: Colors.robine,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 30,
        paddingRight: 30,
        margin: 10,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5
    }
})