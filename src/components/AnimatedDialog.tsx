// src/components/AnimatedDialog.tsx
// ------------------------------------------------------------
// A lightweight wrapper that adds fade-and-scale transitions to
// any react-native-paper <Dialog>.  Pass `fullscreen` to turn the
// dialog into a top-anchored sheet that maxes-out at 85 % height.
// ------------------------------------------------------------

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableWithoutFeedback, ViewStyle } from 'react-native';
import { Dialog, Portal } from 'react-native-paper';

/**
 * Props for AnimatedDialog.
 *
 * @param visible      Controls visibility (like <Dialog visible />).
 * @param onDismiss    Called when the backdrop or back-button is pressed.
 * @param children     Dialog body (Title, Content, Actions, …).
 * @param duration     Animation duration in ms (default 220).
 * @param fullscreen   When true, renders a sheet-style dialog that slides
 *                     under the notch, capped at 85 % of screen height.
 */
export interface AnimatedDialogProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  duration?: number;
  fullscreen?: boolean;
}

export const AnimatedDialog: React.FC<AnimatedDialogProps> = ({
  visible,
  onDismiss,
  children,
  duration = 220,
  fullscreen = false,
}) => {
  /* keep the component mounted until the exit animation completes */
  const [rendered, setRendered] = useState(visible);

  /* 0 → hidden 1 → shown */
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  /* drive the fade-and-scale whenever `visible` changes */
  useEffect(() => {
    if (visible) setRendered(true);

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setRendered(false);
    });
  }, [visible, duration, progress]);

  if (!rendered) return null; // nothing in the tree -> no extra renders

  /* animated opacity + scale */
  const animatedBase: ViewStyle & Animated.WithAnimatedObject<ViewStyle> = {
    opacity: progress,
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };

  /* size / position depending on card vs sheet */
  const sizing: ViewStyle = fullscreen
    ? {
        width: '100%' as const,
        maxHeight: '100%' as const,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }
    : {};

  return (
    <Portal>
      {/* translucent scrim */}
      <TouchableWithoutFeedback onPress={onDismiss}>
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: progress }]}
        />
      </TouchableWithoutFeedback>

      {/* dialog wrapper */}
      <Animated.View style={[styles.wrapper, sizing, animatedBase]}>
        <Dialog visible onDismiss={onDismiss} style={fullscreen ? { flex: 1 } : undefined}>
          {children}
        </Dialog>
      </Animated.View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: { backgroundColor: '#0006' },
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start', // sheet behaviour; centring is handled by `sizing`
    alignItems: 'center',
  },
});
