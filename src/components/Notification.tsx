import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface NotificationProps {
  type: 'success' | 'error';
  message: string;
}

export const Notification: React.FC<NotificationProps> = ({ type, message }) => {
  return (
    <View style={[styles.notification, styles[`notification_${type}`]]}>
      <Text style={styles.notificationText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  notification: {
    position: 'absolute',
    bottom: 4,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notification_success: {
    backgroundColor: '#34C759',
  },
  notification_error: {
    backgroundColor: '#FF3B30',
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
