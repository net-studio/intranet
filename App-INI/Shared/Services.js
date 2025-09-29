import AsyncStorage from "@react-native-async-storage/async-storage";

const setUserAuth = async (value) => {
    await AsyncStorage.setItem('userData', JSON.stringify(value));
}

const getUserAuth = async () => {
    const value = await AsyncStorage.getItem('userData');
    return JSON.parse(value);
}

const setDocumentId = async (value) => {
    await AsyncStorage.setItem('documentId', JSON.stringify(value));
}

const getDocumentId = async () => {
    const value = await AsyncStorage.getItem('documentId');
    return JSON.parse(value);
}

const Logout = async () => {
    await AsyncStorage.clear();
}

export default {
    setUserAuth,
    getUserAuth,
    setDocumentId,
    getDocumentId,
    Logout
}