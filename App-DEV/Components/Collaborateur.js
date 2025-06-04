import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, Dimensions } from 'react-native'
import React, { useEffect, useState, useContext, useCallback } from 'react'
import { AuthContext } from '../Context/AuthContext'
import GlobalApi from '../Shared/GlobalApi'
import Colors from '../Shared/Colors'
import { useNavigation } from "@react-navigation/native";

export default function Collaborateur() {
    const { userData, setUserData } = useContext(AuthContext);
    const [collaborateur, setCollaborateur] = useState([]);
    const navigation = useNavigation();
    
    const getCollaborateur = async () => {
        let p = 1;
        let result = (await GlobalApi.getCollaborateur(p)).data;
        const resp = result.data.map((item) => ({
            id: item.id,
            documentId: item.documentId,
            prenom: item.prenom,
            nom: item.nom,
            telephone: item.telephone,
            email: item.email,
            image: item.photo?.url,
        }))

        while (p < result.meta.pagination.pageCount) {
            p += 1;
            let result = (await GlobalApi.getCollaborateur(p)).data;
            let tmp = result.data.map((item) => ({
                id: item.id,
                documentId: item.documentId,
                prenom: item.prenom,
                nom: item.nom,
                telephone: item.telephone,
                email: item.email,
                image: item.photo?.url,
            }));
            resp.push(...tmp);
        }
        setCollaborateur(resp);
    }

    const onPressCollaborateur = () => {
        navigation.navigate('actualites');
    }

    const OpenURLButton = ({ url, type, children }) => {
        const handlePress = useCallback(async () => {
            if (type == 'email') {
                await Linking.openURL(`mailto:${url}`);
            } else {
                let phoneNumber = url;
                if (Platform.OS === 'ios') {
                    phoneNumber = `telprompt:${url}`;
                } else {
                    phoneNumber = `tel:${url}`;
                }
                const supported = await Linking.canOpenURL(phoneNumber);
                if (supported) {
                    await Linking.openURL(phoneNumber);
                } else {
                    await Linking.openURL(phoneNumber);
                }
            }
        }, [url]);

        return <TouchableOpacity title={children} onPress={handlePress}>
            <Text style={(type == 'phone') ? styles.btnCall : styles.btnEmail}>{url}</Text>
        </TouchableOpacity>
    };

    useEffect(() => {
        getCollaborateur();
    }, [])

    return (
        <View>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.title}>Collaborateurs</Text>
                <Text style={styles.title}>{collaborateur.length} Membres</Text>
            </View>
            <View style={styles.hauteur}>
                <FlatList
                    style={{ flex: 1 }}
                    data={collaborateur}
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    renderItem={({ item }) => (
                        <View style={styles.listItems}>
                            {item.email == userData.email ?
                                <TouchableOpacity onPress={() => onPressCollaborateur()}>
                                    <Image source={{ uri: 'https://robine-api.net-studio.fr' + item.image }} style={styles.image} />
                                </TouchableOpacity>
                                :
                                <TouchableOpacity onPress={() => onPressCollaborateur({
                                    key: item.documentId,
                                    value: item.prenom + ' ' + item.nom,
                                })}>
                                    <Image source={{ uri: item.image }} style={styles.image} />
                                </TouchableOpacity>
                            }
                            <View style={styles.block}>
                                <Text>{item.prenom} {item.nom}</Text>
                                {item.telephone ?
                                    <OpenURLButton url={item.telephone} type='phone'>{item.telephone}</OpenURLButton>
                                    : null}
                                <OpenURLButton url={item.email} type='email'>{item.email}</OpenURLButton>
                            </View>
                        </View>
                    )}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    btnEmail: {
        marginTop: 3,
        elevation: 2,
        borderRadius: 3,
        color: Colors.robine,
        textAlign: 'center',
        padding: 2,
        fontWeight: 'bold'
    },
    btnCall: {
        color: '#fff',
        elevation: 2,
        borderRadius: 3,
        backgroundColor: Colors.robine,
        textAlign: 'center',
        padding: 5,
        fontWeight: 'bold'
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 100,
    },
    listItems: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        elevation: 2,
        backgroundColor: '#fff',
        marginTop: 0,
        marginRight: 5,
        marginBottom: 5,
        marginLeft: 5,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 5,
        paddingLeft: 10,
    },
    hauteur: {
        padding: 0,
        ...Platform.select({
            ios: {
                height: Dimensions.get('screen').height,
            },
            android: {
                height: Dimensions.get('screen').height,
            },
            default: {
                height: Dimensions.get('window').height - 185,
            },
        }),
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 5,
        marginHorizontal: 10,
    },
    block: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginTop: 10,
        alignItems: 'center',
        width: 'calc(0.6 * 100%)',
    }
})