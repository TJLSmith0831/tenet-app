import { useState, useEffect } from 'react';
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
import { httpsCallable } from 'firebase/functions';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, functions } from '../../firebase';

// @ts-ignore
import profanity from 'leo-profanity';
profanity.loadDictionary();

export default function SignupScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { colors, roundness } = useTheme();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
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

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      // Check for valid usernames and names before allowing for creation
      if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('A valid username is required');
      }
      if (
        !username ||
        typeof username !== 'string' ||
        !/^[a-zA-Z0-9_]+$/.test(username) ||
        profanity.check(username)
      ) {
        throw new Error('A valid, non-profane username is required');
      }
      if (
        !name ||
        typeof name !== 'string' ||
        !/^[a-zA-Z0-9_]+$/.test(name) ||
        profanity.check(name)
      ) {
        throw new Error('A valid, non-profane name is required');
      }
      if (username.length > 32) {
        throw new Error('Username is too long');
      }
      if (name.length > 60) {
        throw new Error('Name is too long');
      }
      // 1) Create & sign in the user
      await createUserWithEmailAndPassword(auth, email, password);

      // 2) Force-refresh the new user’s token so Functions will see it
      await auth.currentUser?.getIdToken(true);

      // 2. Call your Cloud Function
      const provisionUser = httpsCallable(functions, 'provisionUser');
      const result: any = await provisionUser({ username, name });

      if (result.data?.handle) {
        navigation.navigate('Home' as never);
      } else {
        setError('Signup succeeded, but provisioning failed');
      }
    } catch (e: any) {
      setError(e.message || 'Signup failed');
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
            Make Your Opinions Count
          </Text>
          <TextInput
            label="Name"
            mode="outlined"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            style={{ marginBottom: 12, overflow: 'hidden' }}
            left={<TextInput.Icon icon="account" />}
          />
          <TextInput
            label="Username"
            mode="outlined"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            style={{ marginBottom: 12, overflow: 'hidden' }}
            left={<TextInput.Icon icon="account" />}
          />
          <TextInput
            label="Email"
            mode="outlined"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={{ marginBottom: 12, overflow: 'hidden' }}
            left={<TextInput.Icon icon="email" />}
          />
          <TextInput
            label="Password"
            mode="outlined"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={{ marginBottom: 8, overflow: 'hidden' }}
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
            onPress={handleSignup}
            disabled={loading}
            style={{ marginTop: 8, borderRadius: roundness }}
            contentStyle={{ paddingVertical: 8 }}
            buttonColor={colors.primary}
            textColor={colors.surface}
          >
            Sign Up
          </Button>
          {loading && <ActivityIndicator animating style={{ marginTop: 16 }} />}
        </Surface>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
