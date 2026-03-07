import React from 'react';
import { Platform, View } from 'react-native';

// Platform-aware QR Code component
let QRCodeComponent;

if (Platform.OS === 'web') {
  // Use react-qr-code for web
  try {
    const QRCodeWeb = require('react-qr-code').default;
    QRCodeComponent = ({ value, size = 200, ...props }) => (
      <View style={{ width: size, height: size }}>
        <QRCodeWeb 
          value={value} 
          size={size}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          {...props} 
        />
      </View>
    );
  } catch (e) {
    console.warn('react-qr-code not available:', e);
    QRCodeComponent = ({ size = 200 }) => (
      <View style={{ 
        width: size, 
        height: size, 
        backgroundColor: '#f0f0f0', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }} />
    );
  }
} else {
  // Use react-native-qrcode-svg for native
  try {
    const QRCodeNative = require('react-native-qrcode-svg').default;
    QRCodeComponent = QRCodeNative;
  } catch (e) {
    console.warn('react-native-qrcode-svg not available:', e);
    QRCodeComponent = ({ size = 200 }) => (
      <View style={{ 
        width: size, 
        height: size, 
        backgroundColor: '#f0f0f0' 
      }} />
    );
  }
}

export default QRCodeComponent;

