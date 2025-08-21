import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FormsWizard from './components/FormsWizard';
import PhotoUploadForm from './components/PhotoUploadForm';

export type RootStackParamList = {
  FormsWizard: undefined;
  PhotoUploadForm: { sellerData: any; carData: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="FormsWizard" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FormsWizard" component={FormsWizard} />
        <Stack.Screen name="PhotoUploadForm" component={PhotoUploadForm} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
