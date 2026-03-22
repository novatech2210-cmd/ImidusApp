/**
 * Web stub for @gorhom/bottom-sheet
 * Provides a modal-based fallback for web preview
 */
import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

interface BottomSheetProps {
  index?: number;
  snapPoints: (string | number)[];
  onChange?: (index: number) => void;
  enablePanDownToClose?: boolean;
  children?: React.ReactNode;
}

const BottomSheet = React.forwardRef<any, BottomSheetProps>(
  ({ snapPoints, children, index = -1, onChange }, ref) => {
    const [isOpen, setIsOpen] = React.useState(index >= 0);

    React.useImperativeHandle(ref, () => ({
      expand: () => {
        setIsOpen(true);
        onChange?.(snapPoints.length - 1);
      },
      collapse: () => {
        setIsOpen(false);
        onChange?.(-1);
      },
      close: () => {
        setIsOpen(false);
        onChange?.(-1);
      },
      snapToIndex: (idx: number) => {
        setIsOpen(idx >= 0);
        onChange?.(idx);
      },
    }));

    if (!isOpen) return null;

    const height = snapPoints[snapPoints.length - 1];
    const numericHeight = typeof height === 'string'
      ? (parseInt(height) / 100) * Dimensions.get('window').height
      : height;

    return (
      <Modal visible={isOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => {
              setIsOpen(false);
              onChange?.(-1);
            }}
          />
          <View style={[styles.sheet, { height: numericHeight }]}>
            {children}
          </View>
        </View>
      </Modal>
    );
  }
);

export const BottomSheetView = View;
export const BottomSheetScrollView = View;
export const BottomSheetFlatList = View;
export const BottomSheetTextInput = View;
export const BottomSheetBackdrop = View;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
});

export default BottomSheet;
