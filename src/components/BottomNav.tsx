import React from 'react';
import { View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';

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

  const renderNavItem = (icon: string, screenKey: BottomNavScreen, size: number = 24) => {
    const color = isFocused(screenKey) ? colors.primary : colors.onSurface;

    return (
      <View style={{ alignItems: 'center' }}>
        <View
          style={
            isFocused(screenKey)
              ? { borderColor: colors.primary, borderWidth: 2, borderRadius: 24, padding: 4 }
              : {}
          }
        >
          <IconButton
            icon={icon}
            size={size}
            iconColor={color}
            onPress={() => setFocusedScreen(screenKey)}
          />
        </View>
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
      {renderNavItem('home', 'my_feed')}
      {renderNavItem('plus-circle-outline', 'create_post', 28)}
      {renderNavItem('account-circle-outline', 'profile')}
    </View>
  );
};

export default BottomNav;
