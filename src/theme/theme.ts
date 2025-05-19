import { MD3LightTheme, configureFonts } from 'react-native-paper';
import customColors from './colors';

const fontConfig = {
  displayLarge: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
  },
  displayMedium: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
  },
  displaySmall: {
    fontFamily: 'Poppins_400Regular',
    fontWeight: '400',
  },
  headlineLarge: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
  },
  headlineMedium: {
    fontFamily: 'Poppins_400Regular',
    fontWeight: '400',
  },
  titleLarge: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
  },
  titleMedium: {
    fontFamily: 'Poppins_400Regular',
    fontWeight: '400',
  },
  bodyLarge: {
    fontFamily: 'Roboto_400Regular',
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: 'Roboto_400Regular',
    fontWeight: '400',
  },
  bodySmall: {
    fontFamily: 'Roboto_400Regular',
    fontWeight: '400',
  },
  labelLarge: {
    fontFamily: 'Roboto_400Regular',
    fontWeight: '400',
  },
  labelMedium: {
    fontFamily: 'Roboto_400Regular',
    fontWeight: '400',
  },
  labelSmall: {
    fontFamily: 'Roboto_400Regular',
    fontWeight: '400',
  },
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...customColors,
    primary: customColors.primary,
    secondary: customColors.secondary,
    background: customColors.background,
    surface: customColors.white,
    text: customColors.textMain,
    error: customColors.error,
    onSurface: customColors.textMain,
    // Optionally set elevation, card, etc.
  },
  // @ts-ignore
  fonts: configureFonts({ config: fontConfig }),
};
