import { Animated } from 'react-native';

describe('Animated Debug', () => {
  it('should have Animated defined', () => {
    console.log('Animated:', !!Animated);
    if (Animated) {
      console.log('Animated.spring:', !!Animated.spring);
      console.log('Animated.timing:', !!Animated.timing);
      console.log('Animated.Value:', !!Animated.Value);
    }
    expect(Animated).toBeDefined();
    expect(Animated.spring).toBeDefined();
  });
});
