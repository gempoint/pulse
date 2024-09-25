import { useSession } from '@/components/ctx';
import isAuthed from '@/hooks/isAuthed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';
import { useTheme } from 'tamagui';
import { Slot, useNavigationContainerRef } from 'expo-router';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

export default function TabLayout() {
  const theme = useTheme()
  const { session, isLoading } = useSession();
  const ref = useNavigationContainerRef();

  useEffect(() => {
    if (ref) {
      routingInstrumentation.registerNavigationContainer(ref);
    }
  }, [ref]);


  if (!session) {
    <Redirect href={"/login"} />
  }

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: theme.accentColor as unknown as string }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="cog" color={color} />,
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: 'Feedback',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="question" color={color} />,
        }}
      />
    </Tabs>
  );
}
