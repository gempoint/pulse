import React from 'react';
import { View, Image, Text, StyleSheet, Pressable } from 'react-native';

interface User {
  id: string;
  verified: boolean;
  staff: boolean;
  artist: boolean;
  pfp: string;
  name: string;
}

interface UserProfileProps {
  user: User;
  onPress?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onPress }) => {
  const renderBadges = () => {
    const badges = [];
    if (user.verified) badges.push('✓');
    if (user.staff) badges.push('👔');
    if (user.artist) badges.push('🎨');

    return badges.map((badge, index) => (
      <Text key={index} style={styles.badge}>
        {badge}
      </Text>
    ));
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: user.pfp }}
          style={styles.profileImage}
        />
        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            <View style={styles.badgeContainer}>
              {renderBadges()}
            </View>
          </View>
          <Text style={styles.userId}>ID: {user.id}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={styles.statValue}>
            {user.verified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Role</Text>
          <Text style={styles.statValue}>
            {user.staff ? 'Staff' : user.artist ? 'Artist' : 'User'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  userId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    fontSize: 16,
    marginHorizontal: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserProfile;