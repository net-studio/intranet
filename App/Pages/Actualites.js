import { View, Text, Image, StyleSheet, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import GlobalApi from '../Shared/GlobalApi';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '../Shared/Colors';
import Menu from '../Components/Menu';
import WelcomeHeader from '../Components/WelcomeHeader';

export default function Actualites() {

    const [actualites, setActualites] = useState([]);

    const getActualites = async () => {
        let p = 1;
        let result = (await GlobalApi.getActualites(p)).data;
        const resp = result.data.map((item) => ({
            id: item.id,
            documentId: item.documentId,
            titre: item.titre,
            soustitre: item.soustitre,
            texte: item.texte,
            images: item.medias,
            position: item.position,
            startdate: item.startdate,
            createdAt: item.createdAt,
        }))
        while (p < result.meta.pagination.pageCount) {
            p += 1;
            let result = (await GlobalApi.getActualites(p)).data;
            let tmp = result.data.map((item) => ({
                id: item.id,
                documentId: item.documentId,
                titre: item.titre,
                soustitre: item.soustitre,
                texte: item.texte,
                images: item.medias,
                position: item.position,
                startdate: item.startdate,
                createdAt: item.createdAt,
            }));
            resp.push(...tmp);
        }
        setActualites(resp);
    }

    useEffect(() => {
        getActualites();
    }, []);

    const showBlock = (actualite, key) => {
        return (
            <View style={styles.block} key={key}>
                <View style={styles.onglet}>
                    <Text style={styles.date}>{new Date(actualite?.startdate).toLocaleDateString('fr-FR')}</Text>
                </View>
                <Text style={styles.sujet}>{actualite?.sujet}</Text>
                <View style={styles.description}>
                    {actualite?.texte ?
                        <>
                            {actualite?.texte.map((elt, id) => {
                                return (
                                    <View key={id}>
                                        {elt?.type == 'list' ?
                                            <View style={styles.listview}>
                                                {elt.children.map((lst, idx) => {
                                                    return (
                                                        <View key={idx}>
                                                            {elt.format == 'ordered' ?
                                                                <View key={idx} style={styles.list}>
                                                                    <Text>{idx + 1}. {lst.children[0]?.text}</Text>
                                                                </View>
                                                                :
                                                                <View key={idx}>
                                                                    <View style={styles.list}>
                                                                        <Ionicons name="checkmark-circle-outline" size={16} color="black" />
                                                                        <Text>{lst.children[0]?.text}
                                                                            {lst.children[1]?.url ?
                                                                                <Text style={{ color: 'blue' }}
                                                                                    onPress={() => Linking.openURL(lst.children[1]?.url)}>
                                                                                    {lst.children[1]?.children[0]?.text}
                                                                                </Text>
                                                                                : null}
                                                                        </Text>
                                                                    </View>
                                                                </View>}
                                                        </View>
                                                    )
                                                })}
                                            </View>
                                            : <Text key={id} style={styles.text}>{elt.children[0]?.text}</Text>
                                        }
                                    </View>
                                );
                            })}
                        </>
                        : null}
                </View>
                <View>
                    {actualite?.images !== null ?
                        <>
                            {actualite?.images.map((elt, id) => {
                                return (
                                    <View key={id}>
                                        <View style={styles.listview}>
                                            <View style={{ width: '100%', paddingBottom: `calc(${elt?.height}/${elt?.width} * 100%)` }}>
                                                <Image source={{ uri: GlobalApi.API_URL + elt?.url }} style={{ position: 'absolute', borderRadius: 5, display: 'block', width: '100%', height: '100%' }} />
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </>
                        : null}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.main}>
            <WelcomeHeader />
            <View style={styles.container}>
                <View style={styles.mainhead}>
                    <Text style={styles.titre}>Robine Intranet</Text>
                    <Text style={styles.titre}>News</Text>
                </View>
                <View style={styles.scroll}>
                    <View style={styles.block}>
                        <ScrollView style={styles.contentContainer}>
                            {actualites.map((actualite, key) => {
                                return (
                                    <View key={key}>
                                        {showBlock(actualite, key)}
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </View>
            <View style={styles.footer}>
                <Menu />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    date: {
        fontSize: 12,
        color: Colors.white,
        backgroundColor: Colors.strongray,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        paddingHorizontal: 5,
        paddingVertical: 3,
        marginBottom: 1,
    },
    onglet: {
        justifyContent: 'flex-end',
        flexDirection: 'row',
    },
    sujet: {
        color: '#fff',
        marginTop: 0,
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: Colors.robine,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderTopLeftRadius: 5,
    },
    listview: {
        flex: 1,
        gap: 10,
        alignItems: 'center',
    },
    list: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    text: {
        flex: 1,
        marginVertical: 5
    },
    description: {
        flex: 1,
        paddingHorizontal: 10,
        marginVertical: 5,
    },
    contentContainer: {
        borderRadius: 10,
        elevation: 2,
        marginTop: 2,
        marginBottom: 5,
        marginHorizontal: 5,
        paddingVertical: 0,
    },
    scroll: {
        flex: 1,
        gap: 5,
        marginHorizontal: 5,
        marginBottom: 5,
        backgroundColor: 'none',
        paddingVertical: 0,
        paddingHorizontal: 0,
        justifyContent: 'space-between',
    },
    block: {
        flex: 1,
        paddingHorizontal: 0,
        paddingTop: 5,
        marginBottom: 0,
        backgroundColor: '#fff',
    },
    mainhead: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    titre: {
        textAlign: 'center',
        margin: 5,
        fontSize: 16,
        fontWeight: 'bold'
    },
    container: {
        flex: 1,
        backgroundColor: '#eee',
    },
    footer: {
        // flex: 1,
        // justifyContent: 'flex-end'
    },
    main: {
        flex: 1,
    }
})