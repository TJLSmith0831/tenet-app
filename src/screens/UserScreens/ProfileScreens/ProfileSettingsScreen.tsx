import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Appbar,
  Avatar,
  Button,
  HelperText,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../../redux/store';
// import { updateProfile } from '../../../redux/slices/authSlice'; // <— patch to your action
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../firebase';
import { AuthState, updateProfile } from '../../../redux/slices/authSlice';

const ProfileSettingsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user as AuthState); // tweak as needed

  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string>(user.avatarUri ?? '');
  const [saving, setSaving] = useState(false);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      // TODO: upload avatar & persist profile changes
      dispatch(updateProfile({ name, handle, bio, avatarUri }));
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Appbar.Header style={{ backgroundColor: colors.background }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Profile" />
        <Appbar.Action icon="content-save" disabled={saving} onPress={onSave} />
      </Appbar.Header>

      {/* —— form ——*/}
      <View style={{ padding: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          {avatarUri ? (
            <Avatar.Image size={120} source={{ uri: avatarUri }} />
          ) : (
            <Avatar.Text size={120} label={user.name?.substring(0, 2) ?? ''} />
          )}
          <IconButton icon="pencil" size={20} onPress={pickAvatar} />
        </View>

        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Handle"
          value={handle}
          onChangeText={setHandle}
          mode="outlined"
          style={{ marginBottom: 16 }}
          left={<TextInput.Affix text="@" />}
        />
        <HelperText type="info">Handles must be unique and lowercase.</HelperText>

        <TextInput
          label="Bio"
          value={bio}
          onChangeText={setBio}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={{ marginBottom: 24 }}
        />

        <Button mode="contained" onPress={onSave} loading={saving}>
          Save Changes
        </Button>

        <Button
          style={{ marginTop: 24 }}
          mode="text"
          onPress={async () => {
            await signOut(auth);
            navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
          }}
        >
          Log out
        </Button>
      </View>
    </View>
  );
};

export default ProfileSettingsScreen;
