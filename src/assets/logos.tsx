import React from 'react';
import { Image } from 'react-native';

export const TenetLogo = React.memo(() => (
  <Image
    source={require('./tenet-main-logo.png')}
    style={{ width: 72, height: 72, resizeMode: 'contain' }}
  />
));
