import React from 'react';
import { Modal, View, StyleSheet, Platform, StatusBar } from 'react-native';

/**
 * ProductionModal - A Modal wrapper component that fixes rendering issues in production APK builds
 * 
 * This component addresses common issues with React Native Modal in production builds,
 * particularly on Android with edge-to-edge display enabled.
 * 
 * Key fixes:
 * - Adds statusBarTranslucent for proper Android edge-to-edge handling
 * - Sets presentationStyle="overFullScreen" for consistent rendering
 * - Applies proper padding for status bar on Android
 * - Ensures modal overlay is properly rendered with elevation/shadow
 * 
 * Usage:
 *   <ProductionModal visible={isVisible} onRequestClose={handleClose}>
 *     <View style={styles.modalContent}>
 *       // Your modal content here
 *     </View>
 *   </ProductionModal>
 */
const ProductionModal = ({
  visible,
  onRequestClose,
  animationType = 'slide',
  children,
  overlayStyle = {},
  ...otherProps
}) => {
  return (
    <Modal
      animationType={animationType}
      transparent={true}
      visible={visible}
      onRequestClose={onRequestClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      {...otherProps}
    >
      <View style={[styles.modalOverlay, overlayStyle]}>
        {children}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
});

export default ProductionModal;
