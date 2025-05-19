import React, { useRef } from 'react';
import { TextInput, View, TouchableOpacity, Animated } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';

interface TenetSearchBarProps {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onCollapse: () => void;
  onPress: () => void;
}

const TenetSearchBar = ({
  visible,
  value,
  onChangeText,
  onCollapse,
  onPress,
}: TenetSearchBarProps) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  if (!visible) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <IconButton
          icon="magnify"
          onPress={() => {
            onChangeText('');
            onPress();
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginVertical: 8,
      }}
    >
      <TextInput
        ref={inputRef}
        placeholder="Search Tenet..."
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        placeholderTextColor="#888"
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingHorizontal: 16,
          height: 40,
          color: colors.onSurface,
        }}
      />
      <IconButton icon="close" onPress={onCollapse} />
    </View>
  );
};

export default TenetSearchBar;
