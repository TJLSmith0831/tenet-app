import React from 'react';
import { View } from 'react-native';
import { Icon, IconButton, useTheme } from 'react-native-paper';

export type BottomNavScreen = 'my_feed' | 'create_post' | 'profile';

type BottomNavProps = {
  focusedScreen: BottomNavScreen;
  setFocusedScreen: (screen: BottomNavScreen) => void;
};

/**
 * BottomNav Component
 *
 * Displays a persistent bottom navigation bar with three icons:
 * - Home (My Feed)
 * - Plus (Create Post)
 * - Account (Profile)
 *
 * The active screen is visually highlighted. Navigation is controlled via the
 * `focusedScreen` prop and updated with the `setFocusedScreen` callback.
 *
 * @param focusedScreen - The current active screen in the bottom navigation ('my_feed' | 'create_post' | 'profile').
 * @param setFocusedScreen - Function to update the currently focused screen when a nav item is pressed.
 *
 * @returns A styled bottom navigation bar with three interactive icons.
 */
const BottomNav = ({ focusedScreen, setFocusedScreen }: BottomNavProps) => {
  const { colors } = useTheme();

  const isFocused = (screen: BottomNavScreen) => focusedScreen === screen;

  const getIconName = (screenKey: BottomNavScreen) => {
    switch (screenKey) {
      case 'my_feed':
        return isFocused(screenKey) ? 'home' : 'home-outline';
      case 'create_post':
        return isFocused(screenKey) ? 'plus-circle' : 'plus-circle-outline';
      case 'profile':
        return isFocused(screenKey) ? 'account-circle' : 'account-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderNavItem = (screenKey: BottomNavScreen, size: number = 24) => {
    const iconName = getIconName(screenKey);
    const color = isFocused(screenKey) ? colors.primary : colors.onSurface;

    return (
      <View style={{ alignItems: 'center' }}>
        <IconButton
          icon={({ size }) => <Icon source={iconName} size={size} color={color} />}
          size={size}
          onPress={() => setFocusedScreen(screenKey)}
          // mode="outlined"
        />
      </View>
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderColor: '#ccc',
        backgroundColor: colors.surface,
      }}
    >
      {renderNavItem('my_feed')}
      {renderNavItem('create_post')}
      {renderNavItem('profile')}
    </View>
  );
};

export default BottomNav;
