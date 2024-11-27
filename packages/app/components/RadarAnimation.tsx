import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const RadarAnimation = ({ numberOfDots = 5 }) => {
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const dots = useRef([]);

  useEffect(() => {
    dots.current = Array(numberOfDots).fill(0).map(() => ({
      angle: Math.random() * 2 * Math.PI,
      distance: (0.3 + Math.random() * 0.6),
      opacity: new Animated.Value(0.3 + Math.random() * 0.7)
    }));

    dots.current.forEach(dot => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot.opacity, {
            toValue: 0.2,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true
          }),
          Animated.timing(dot.opacity, {
            toValue: 1,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    });
  }, [numberOfDots]);

  useEffect(() => {
    const startSweepAnimation = () => {
      Animated.loop(
        Animated.timing(sweepAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        })
      ).start();
    };

    startSweepAnimation();
  }, []);

  const { width } = Dimensions.get('window');
  const size = width * 0.8;
  const radius = size / 2;

  const rotate = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Calculate sweep opacity for fade effect
  const sweepOpacity = sweepAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.2, 0.8]
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circles */}
      <View style={[styles.circle, { width: size, height: size }]} />
      <View style={[styles.circle, { width: size * 0.66, height: size * 0.66 }]} />
      <View style={[styles.circle, { width: size * 0.33, height: size * 0.33 }]} />

      {/* Cross lines */}
      <View style={[styles.line, { width: size }]} />
      <View style={[styles.line, { width: size, transform: [{ rotate: '90deg' }] }]} />

      {/* New centered sweep circle */}
      <Animated.View
        style={[
          styles.sweepContainer,
          {
            width: size,
            height: size,
            transform: [{ rotate }]
          }
        ]}
      >
        <Animated.View
          style={[
            styles.sweepLine,
            {
              opacity: sweepOpacity,
              width: radius
            }
          ]}
        />
      </Animated.View>

      {/* Dots */}
      {dots.current.map((dot, index) => {
        const x = Math.cos(dot.angle) * (radius * dot.distance);
        const y = Math.sin(dot.angle) * (radius * dot.distance);

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                transform: [
                  { translateX: x },
                  { translateY: y }
                ],
                opacity: dot.opacity
              }
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 1000,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff'
  },
  circle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 1000
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)'
  },
  sweepContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sweepLine: {
    height: 2,
    backgroundColor: '#fff',
    position: 'absolute'
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3
  }
});

export default RadarAnimation;