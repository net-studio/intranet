import { View } from 'react-native'
import React, { useContext } from 'react'
import WelcomeHeader from '../Components/WelcomeHeader';
import { AuthContext } from '../Context/AuthContext'
import Dashboard from './Dashboard';

export default function Home() {
  const { userData, setUserData } = useContext(AuthContext);

  return (
    <View style={{flex: 1, justifyContent:'space-between'}}>
      <WelcomeHeader />
      <Dashboard />
    </View>
  )
}