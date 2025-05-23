import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import MainScreen from './screens/MainScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import { PaperProvider } from 'react-native-paper';
import { theme } from './theme/theme';
import { useFonts, Poppins_700Bold, Poppins_400Regular } from '@expo-google-fonts/poppins';
import { Roboto_400Regular } from '@expo-google-fonts/roboto';
import { View } from 'react-native';
import HomeScreen from './screens/UserScreens/HomeScreen';
import ProfileSettingsScreen from './screens/UserScreens/ProfileScreens/ProfileSettingsScreen';

const { Navigator, Screen } = createNativeStackNavigator();

const App = () => {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_400Regular,
    Roboto_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#D4F4E4' }} />;
  }

  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
            <Screen name="Main" component={MainScreen} />
            <Screen name="Login" component={LoginScreen} />
            <Screen name="Signup" component={SignupScreen} />
            <Screen name="Home" component={HomeScreen} />
            <Screen
              name="ProfileSettings"
              component={ProfileSettingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </Navigator>
        </NavigationContainer>
      </PaperProvider>
    </Provider>
  );
};

export default App;
