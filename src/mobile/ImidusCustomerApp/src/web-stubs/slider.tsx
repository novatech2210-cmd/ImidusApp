/**
 * Web stub for @react-native-community/slider
 */
import React from 'react';
import {StyleSheet, View} from 'react-native';

interface SliderProps {
  value?: number;
  onValueChange?: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: any;
  disabled?: boolean;
}

const Slider: React.FC<SliderProps> = ({
  value = 0,
  onValueChange,
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  minimumTrackTintColor = '#1E5AA8',
  maximumTrackTintColor = '#DDDDDD',
  thumbTintColor = '#1E5AA8',
  style,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat((e.target as HTMLInputElement).value);
    onValueChange?.(newValue);
  };

  return (
    <View style={[styles.container, style]}>
      <input
        type="range"
        min={minimumValue}
        max={maximumValue}
        step={step || 'any'}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        style={{
          width: '100%',
          height: 40,
          accentColor: thumbTintColor,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default Slider;
