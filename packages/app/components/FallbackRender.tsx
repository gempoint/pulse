import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';

const FallbackRender = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Application Error</Text>

        <Text style={styles.errorMessage}>
          A critical error prevented the application from rendering correctly.
        </Text>

        {error && (
          <View style={styles.errorDetailsWrapper}>
            <ScrollView
              style={styles.errorDetailsContainer}
              contentContainerStyle={styles.errorDetailsContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.errorDetailsTitle}>Full Error Details:</Text>
              <Text style={styles.errorDetailsText}>
                {error.toString()}

                {error.stack && `\n\nStack Trace:\n${error.stack}`}
              </Text>
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => resetErrorBoundary()}
        >
          <Text style={styles.retryButtonText}>Restart Application</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 15,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDetailsWrapper: {
    width: '100%',
    maxHeight: 250,
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    marginBottom: 20,
  },
  errorDetailsContainer: {
    width: '100%',
  },
  errorDetailsContent: {
    padding: 15,
  },
  errorDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 10,
  },
  errorDetailsText: {
    fontSize: 8,
    color: '#A0A0A0',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
    }),
  },
  retryButton: {
    backgroundColor: '#4A4A4A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FallbackRender;