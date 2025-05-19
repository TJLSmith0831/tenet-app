import React, { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import {
  Surface,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  HelperText,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../redux/store';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { AuthState, setUser } from '../redux/slices/authSlice';
import { refetchPosts } from '../redux/slices/feedSlice';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { colors, roundness } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Card entrance animation
  const [cardAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Sign in
      await signInWithEmailAndPassword(auth, email, password);

      // 2. Force a fresh ID‐token
      await auth.currentUser?.getIdToken(true);

      // 3. Call loginUser
      const loginUserFn = httpsCallable(functions, 'loginUser');
      const response = await loginUserFn({});

      // 4. Set user
      dispatch(setUser(response.data as AuthState));

      // 5. Pull posts
      await dispatch(refetchPosts());

      // 5. Navigate away
      navigation.navigate('Home' as never);
    } catch (e: any) {
      setError(e.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <IconButton
        icon="arrow-left"
        size={28}
        style={{ position: 'absolute', top: '5%', left: 16, zIndex: 10 }}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
      />
      <View style={{ alignItems: 'center' }}>
        <Animated.Image
          source={require('../assets/tenet-main-logo.png')}
          style={{
            width: 200,
            height: 200,
            opacity: cardAnim,
            transform: [{ scale: cardAnim }],
          }}
          resizeMode="contain"
        />
      </View>
      <Animated.View
        style={{
          opacity: cardAnim,
          transform: [
            { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
          ],
        }}
      >
        <Surface
          style={{
            marginHorizontal: 24,
            padding: 24,
            borderRadius: roundness * 2,
            elevation: 4,
            backgroundColor: colors.surface,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
          }}
        >
          <Text
            variant="titleMedium"
            style={{ color: colors.secondary, marginBottom: 4, alignSelf: 'center' }}
          >
            Continue the Discussion
          </Text>
          <TextInput
            label="Email"
            mode="outlined"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={{ marginBottom: 12 }}
            left={<TextInput.Icon icon="account" />}
          />
          <TextInput
            label="Password"
            mode="outlined"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={{ marginBottom: 8 }}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(prev => !prev)}
              />
            }
          />
          <HelperText type="error" visible={!!error} style={{ marginBottom: 4 }}>
            {error}
          </HelperText>
          <Button
            mode="contained"
            onPress={handleLogin}
            disabled={loading}
            style={{ marginTop: 8, borderRadius: roundness }}
            contentStyle={{ paddingVertical: 8 }}
            buttonColor={colors.primary}
            textColor={colors.surface}
          >
            Login
          </Button>
          {loading && <ActivityIndicator animating style={{ marginTop: 16 }} />}
        </Surface>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
