import React from 'react';
import { View, Text, Image } from 'tamagui';

type UserProfileProps = {
  user: User;
};

const UserProfileSummary: React.FC<UserProfileProps> = ({ user }) => {
  //console.log(user)
  return (
    <View
      bordered
      borderWidth={1}
      borderColor="$background2"
      backgroundColor="$background1"
      padding="$4"
      borderRadius="$4"
      flexDirection="row"
      alignItems="center"
    >
      <Image
        source={{ uri: user.pfp }}
        width={56}
        height={56}
        borderRadius={28}
      />
      <View marginLeft="$4" flex={1}>
        <View flexDirection="row" alignItems="center">
          <Text fontWeight="bold" fontSize="$5" numberOfLines={1} flex={1}>
            {user.name}
          </Text>
          {user.verified && (
            <View
              backgroundColor="$blue"
              padding="$1 $2"
              borderRadius="$2"
              marginLeft="$2"
            >
              <Text color="$background1" fontSize="$2" fontWeight="bold">
                Verified
              </Text>
            </View>
          )}
          {user.staff && (
            <View
              backgroundColor="$green"
              padding="$1 $2"
              borderRadius="$2"
              marginLeft="$2"
            >
              <Text color="$background1" fontSize="$2" fontWeight="bold">
                Staff
              </Text>
            </View>
          )}
          {user.artist && (
            <View
              backgroundColor="$pink"
              padding="$1 $2"
              borderRadius="$2"
              marginLeft="$2"
            >
              <Text color="$background1" fontSize="$2" fontWeight="bold">
                Artist
              </Text>
            </View>
          )}
        </View>
        <Text color="$gray11" fontSize="$4" numberOfLines={2}>
          {user.bio}
        </Text>
        <View marginTop="$2" flexDirection="row" alignItems="center">
          <Text color="$gray11" fontSize="$4">
            @{user.username}
          </Text>
          {user.state && (
            <View
              backgroundColor={user.state.color}
              padding="$1 $2"
              borderRadius="$2"
              marginLeft="$2"
            >
              <Text color="$background1" fontSize="$2" fontWeight="bold">
                {user.state.name}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default UserProfileSummary;