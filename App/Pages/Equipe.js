import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Image, Platform, Dimensions } from 'react-native'
import React, { useEffect, useState, useContext, useCallback } from 'react'
import { AuthContext } from '../Context/AuthContext'
import GlobalApi from '../Shared/GlobalApi'
import Colors from '../Shared/Colors'
import { useNavigation } from "@react-navigation/native";
import Menu from '../Components/Menu';
import WelcomeHeader from '../Components/WelcomeHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
import filter from 'lodash.filter';
import { SelectList } from 'react-native-dropdown-select-list';

export default function Equipe() {
    const { userData, setUserData } = useContext(AuthContext);
    const [collaborateur, setCollaborateur] = useState([]);
    const [query, setQuery] = useState('');
    const [fullData, setFullData] = useState([]);
    const [selectedData, setSelectedData] = useState([]);
    const [listSelected, setListSelected] = useState(undefined);
    const [agences, setAgences] = useState([]);
    const navigation = useNavigation();

    const getAgences = async () => {
        let p = 1;
        let result = (await GlobalApi.getAgences(p)).data;
        const resp = result.data.map((item) => ({
            key: item.documentId,
            value: item.label,
        }))

        while (p < result.meta.pagination.pageCount) {
            p += 1;
            let result = (await GlobalApi.getAgences(p)).data;
            let tmp = result.data.map((item) => ({
                key: item.documentId,
                value: item.label,
            }));
            resp.push(...tmp);
        }
        setAgences(resp);
    }
    const getCollaborateur = async () => {
        let p = 1;
        let result = (await GlobalApi.getCollaborateur(p)).data;
        const resp = result.data.map((item) => ({
            id: item.id,
            documentId: item.documentId,
            prenom: item.prenom,
            nom: item.nom,
            agence: item.agence?.label,
            agenceId: item.agence?.documentId,
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
                agence: item.agence?.label,
                agenceId: item.agence?.documentId,
                telephone: item.telephone,
                email: item.email,
                image: item.photo?.url,
            }));
            resp.push(...tmp);
        }
        // setCollaborateur(resp);
        setFullData(resp);
        if (listSelected !== undefined) {
            setSelectedData(filter(resp, { agenceId: listSelected }));
            setCollaborateur(filter(resp, { agenceId: listSelected }));
        } else {
            setSelectedData(resp);
            setCollaborateur(resp);
        }
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
        getAgences();
    }, [listSelected])

    const SearchInput = () => {
        return (
            <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="always"
                value={query}
                onChangeText={(queryText) => { handleSearch(queryText) }}
                placeholder='Rechercher' placeholderTextColor="#aaa"
                ref={inputElement => {
                    if (inputElement) {
                        inputElement.focus();
                    }
                }}
            />
        )
    }
    function RenderHeader() {
        return (
            <View style={styles.search}>
                <SearchInput />
                <TouchableOpacity onPress={resetSearch}>
                    <Ionicons name="close-circle" size={24} color={Colors.lightgray} />
                </TouchableOpacity>
            </View>
        );
    }

    const resetSearch = () => {
        setSelectedData(undefined);
        setCollaborateur(fullData);
        setQuery('');
        setListSelected(undefined);
    }

    const handleSearch = text => {
        const formattedQuery = text.toLowerCase();
        const filteredData = filter(selectedData, user => {
            return contains(user, formattedQuery);
        });
        setCollaborateur(filteredData);
        setQuery(text);
    };

    const contains = ({ prenom, nom, email, agence }, query) => {
        if (agence?.toLowerCase().includes(query) || prenom?.toLowerCase().includes(query) || nom?.toLowerCase().includes(query) || email?.includes(query)) {
            return true
        }
        return false
    }

    return (
        <View>
            <WelcomeHeader />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.title}>Collaborateurs</Text>
                <Text style={styles.title}>{collaborateur.length} Membres</Text>
            </View>
            <SelectList
                search={true}
                boxStyles={styles.select}
                placeholder='Selection par Agence :'
                setSelected={(val) => setListSelected(val)}
                data={agences}
                save="key"
            />
            <RenderHeader />
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
                                    <Image source={{ uri: GlobalApi.API_URL + item.image }} style={styles.image} />
                                </TouchableOpacity>
                                :
                                <TouchableOpacity onPress={() => onPressCollaborateur({
                                    key: item.documentId,
                                    value: item.prenom + ' ' + item.nom,
                                })}>
                                    <Image source={{ uri: GlobalApi.API_URL + item.image }} style={styles.image} />
                                </TouchableOpacity>
                            }
                            <View style={styles.block}>
                                <Text>{item.prenom} {item.nom}</Text>
                                <Text style={{ fontWeight: 'bold' }}>{item.agence}</Text>
                                {item.telephone ?
                                    <OpenURLButton url={item.telephone} type='phone'>{item.telephone}</OpenURLButton>
                                    : null}
                                <OpenURLButton url={item.email} type='email'>{item.email}</OpenURLButton>
                            </View>
                        </View>
                    )}
                />
            </View>
            <View style={styles.footer}>
                <Menu />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    select: {
        flex: 1,
        borderColor: "#ddd",
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginHorizontal: 5,
        backgroundColor: '#fff'
    },
    input: {
        flex: 1,
        borderStyle: 'none',
        backgroundColor: 'transparent',
        marginRight: 10,
        paddingVertical: 10,
        paddingHorizontal: 10
    },
    search: {
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 0,
        paddingHorizontal: 5,
        borderRadius: 5,
        elevation: 2,
        marginTop: 5,
        marginBottom: 5,
        marginHorizontal: 5,
        alignItems: 'center',
    },
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
    },
    footer: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    main: {
        flex: 1,
    }
})