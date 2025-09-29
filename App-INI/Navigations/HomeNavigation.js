import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../Pages/Home';
import Equipe from '../Pages/Equipe';
import Actualites from '../Pages/Actualites';
import Agenda from '../Pages/Agenda';
import Chat from '../Pages/Chat';
import Docs from '../Pages/Docs';
import RH from '../Pages/RH';
import CreateEvent from '../Components/CreateEvent';
import EventDetails from '../Components/EventDetails';
import Profile from '../Pages/Profile';
import Settings from '../Pages/Settings';
import HRPolicies from '../Pages/HRPolicies';
import LeaveRequests from '../Pages/LeaveRequests';
import LeaveRequestDetails from '../Components/LeaveRequestDetails';
import SalarySlips from '../Pages/SalarySlips';
import DocumentViewer from '../Components/DocumentViewer';
import NotificationTracker from '../Components/NotificationTracker';
import Notifications from '../Pages/Notifications';
import LeaveRequestAdmin from '../Pages/LeaveRequestAdmin';
import LeaveRequestDetailsAdmin from '../Components/LeaveRequestDetailsAdmin';

const Stack = createNativeStackNavigator();

export default function HomeNavigation() {
  return (
    <Stack.Navigator screenOptions={{headerShown:false}}>
        <Stack.Screen name="home" component={Home} />
        <Stack.Screen name="equipe" component={Equipe} />
        <Stack.Screen name="actualites" component={Actualites} />
        <Stack.Screen name="agenda" component={Agenda} />
        <Stack.Screen name="EventDetails" component={EventDetails} />
        <Stack.Screen name="CreateEvent" component={CreateEvent} />
        <Stack.Screen name="chat" component={Chat} />
        <Stack.Screen name="docs" component={Docs} />
        <Stack.Screen name="rh" component={RH} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="HRPolicies" component={HRPolicies} />
        <Stack.Screen name="LeaveRequests" component={LeaveRequests} />
        <Stack.Screen name="LeaveRequestDetails" component={LeaveRequestDetails} />
        <Stack.Screen name="LeaveRequestDetailsAdmin" component={LeaveRequestDetailsAdmin} />
        <Stack.Screen name="admin" component={LeaveRequestAdmin} />
        <Stack.Screen name="SalarySlips" component={SalarySlips} />
        <Stack.Screen name="DocumentViewer" component={DocumentViewer} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="NotificationTracker" component={NotificationTracker} />
    </Stack.Navigator>
  )
}