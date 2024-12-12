import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { router, Stack, useNavigationContainerRef, useRootNavigationState } from "expo-router";
import { AppState, Pressable, useColorScheme } from "react-native";
import { TamaguiProvider, useTheme } from "tamagui";
import { tamaguiConfig } from "../tamagui.config";
import { useFonts } from "expo-font";
import { useEffect, useRef, useState } from "react";
import {
	SafeAreaProvider,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as Sentry from "@sentry/react-native";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import CurrentToast from "@/components/CurrentToast";
import { ArrowLeft } from "@tamagui/lucide-icons";
import { ErrorBoundary } from "react-error-boundary";
import { SWRConfig } from "swr";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { RADAR } from "@/constants/idk";
import * as Location from "expo-location";
import { radarAdd } from "@/etc/api";
import { registerDevMenuItems } from "expo-dev-menu";
import { init } from "@/components/etc";
import FallbackRender from "@/components/FallbackRender";
import * as Notifications from "expo-notifications";
import { PortalProvider } from "@tamagui/portal";
// @ts-ignore
import { ModalView } from "react-native-ios-modal";
import { setupNativeSheet } from "@tamagui/sheet";
//import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
// random ios thing for better app thing idk
setupNativeSheet("ios", ModalView);

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

const debug = async () => {
	const keys_ = await AsyncStorage.getAllKeys();
	let keys = [];
	for (let key in keys_) {
		let x = `${key}: ${await AsyncStorage.getItem(key)}`;
		keys.push({
			name: x,
			callback: () => { },
		});
	}
	//console.log("k", keys)
	return keys;
};

debug().then((x) => registerDevMenuItems(x));

const reactNavigationIntegration = Sentry.reactNavigationIntegration({
	enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

console.log("devMode:", __DEV__);
Sentry.init({
	enableAppStartTracking: true,
	enableNativeFramesTracking: true,
	enableStallTracking: true,
	enableUserInteractionTracing: true,
	dsn: Constants.expoConfig?.extra!.DSN,
	debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
	enabled: true,
	_experiments: {
		replaysOnErrorSampleRate: 1.0,
		replaysSessionSampleRate: 1.0,
	},
	integrations: [
		reactNavigationIntegration,
		Sentry.mobileReplayIntegration(),
	],
});

TaskManager.defineTask(RADAR, async () => {
	try {
		let loc = await Location.getLastKnownPositionAsync();
		if (loc === null) {
			// wow
			throw "no loc";
		} else {
			await radarAdd(loc.coords.latitude, loc.coords.longitude);
		}
		return BackgroundFetch.BackgroundFetchResult.NewData;
	} catch (e) {
		console.error("radar-refresh failed");
		console.error("radar-refresh err", e);
		return BackgroundFetch.BackgroundFetchResult.Failed;
	}
});

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask(
	BACKGROUND_NOTIFICATION_TASK,
	({ data, error, executionInfo }) => {
		console.log("Received a notification in the background!");
		console.log("background notif data: ", data);
		// Do something with the notification data
	},
);

try {
	init();
	Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
} catch (err) {
	console.error("init failed?");
	console.error("init err: ", err);
}

const useNetworkState = () => {
	const [isOnline, setIsOnline] = useState<boolean | null>(true);

	useEffect(() => {
		// Initial check
		NetInfo.fetch().then((state) => {
			setIsOnline(state.isConnected);
		});

		// Subscribe to network state updates
		const unsubscribe = NetInfo.addEventListener((state) => {
			setIsOnline(state.isConnected);
		});

		return () => {
			unsubscribe();
		};
	}, []);

	return isOnline;
};

SplashScreen.preventAutoHideAsync();

//SplashScreen.setOptions({
//	duration: 1000,
//	fade: true,
//});

function RootLayout() {
	//const [network, setNetwork] = useState<boolean | null>()
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
		InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
	});

	const { left, top, right } = useSafeAreaInsets();
	const isOnline = useNetworkState();
	const ref = useNavigationContainerRef();
	const rootNavigationState = useRootNavigationState()
	const navigatorReady = rootNavigationState?.key != null
	const notificationListener = useRef();
	const responseListener = useRef();
	const appState = useRef(AppState.currentState);
	const [appStateVisible, setAppStateVisible] = useState(appState.current);
	const [notification, setNotification] = useState<Notification | false>(false);


	useEffect(() => {
		if (!navigatorReady) {
			SplashScreen.hideAsync()
		}
		// It is ready! Navigate code here!
	}, [navigatorReady])

	useEffect(() => {
		//SystemUI.setBackgroundColorAsync(theme.background.);
		if (loaded) {
			// can hide splash screen here
		}

		if (ref?.current) {
			reactNavigationIntegration.registerNavigationContainer(ref);
		}

		notificationListener.current =
			Notifications.addNotificationReceivedListener((notification) => {
				setNotification(notification);
			});

		// Listen for user interaction with notification
		responseListener.current =
			Notifications.addNotificationResponseReceivedListener((response) => {
				handleNotificationResponse(response);
			});

		const subscription = AppState.addEventListener("change", (nextAppState) => {
			appState.current = nextAppState;
			setAppStateVisible(appState.current);
			console.log("app state:", nextAppState);
		});

		async function handleNotificationResponse(
			response: Notifications.NotificationResponse,
		) {
			const { notification } = response;
			const { data } = notification.request.content;

			// Handle notification data based on app state
			if (appStateVisible === "active") {
				// App is in foreground
				console.log("Handling notification in foreground:", data);
				// Add your foreground handling logic here
			} else {
				// App is in background or quit state
				console.log("Handling notification in background:", data);
				// Add your background handling logic here
			}
		}

		return () => {
			Notifications.removeNotificationSubscription(
				notificationListener.current,
			);
			Notifications.removeNotificationSubscription(responseListener.current);
			subscription.remove();
		};
	}, [loaded, ref]);

	if (!loaded) {
		return undefined;
	}

	console.log(colorScheme);
	return (
		<ErrorBoundary fallbackRender={FallbackRender}>
			<SWRConfig
				value={{
					provider: () => new Map(),
					isVisible: () => {
						return true;
					},
					isOnline: () => {
						return isOnline!;
					},
					initFocus(callback) {
						let appState = AppState.currentState;

						const onAppStateChange = (nextAppState: string) => {
							/* If it's resuming from background or inactive mode to active one */
							if (
								appState.match(/inactive|background/) &&
								nextAppState === "active"
							) {
								callback();
							}
							appState = nextAppState;
						};

						// Subscribe to the app state change events
						const subscription = AppState.addEventListener(
							"change",
							onAppStateChange,
						);

						return () => {
							subscription.remove();
						};
					},
					initReconnect(callback) {
						let unsubscribe;

						unsubscribe = NetInfo.addEventListener((state) => {
							if (state.isConnected) {
								callback();
							}
						});

						return () => {
							unsubscribe?.();
						};
					},
				}}
			>
				<TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
					<ThemeProvider value={DarkTheme}>
						<PortalProvider shouldAddRootHost>
							<SafeAreaProvider>
								<ToastProvider>
									<CurrentToast />
									<ToastViewport
										flexDirection="column-reverse"
										top={top}
										left={left}
										right={right}
									/>
									<Stack>
										<Stack.Screen
											name="(tabs)"
											options={{ headerShown: false }}
										/>
										<Stack.Screen
											name="auth"
											options={{ headerShown: false }}
										/>
										<Stack.Screen
											name="onboard"
											options={{ headerShown: false }}
										/>
										<Stack.Screen
											name="user/[name]"
											options={{ headerShown: false }}
										/>
										<Stack.Screen
											name="selector"
											options={{
												//headerShown: false,
												headerStyle: {
													backgroundColor: "#000",
												},
												//header: () => { },
												headerLeft: () => (
													<Pressable
														onPress={() => router.back()}
													//className="p-2 ml-2"
													>
														<ArrowLeft color="white" size={24} />
													</Pressable>
												),
												headerTitle: "",
												presentation: "containedModal",
											}}
										/>
										<Stack.Screen
											name="settings"
											options={{
												//headerShown: false,
												headerStyle: {
													backgroundColor: "#000",
												},
												//header: () => { },
												headerLeft: () => (
													<Pressable
														onPress={() => router.back()}
													//className="p-2 ml-2"
													>
														<ArrowLeft color="white" size={24} />
													</Pressable>
												),
												headerTitle: "",
												//presentation: "card",
											}}
										/>
										<Stack.Screen
											name="feedback"
											options={{
												//headerShown: false,
												headerStyle: {
													backgroundColor: "#000",
												},
												//header: () => { },
												headerLeft: () => (
													<Pressable
														onPress={() => router.back()}
													//className="p-2 ml-2"
													>
														<ArrowLeft color="white" size={24} />
													</Pressable>
												),
												headerTitle: "",
												presentation: "containedModal",
											}}
										/>
										<Stack.Screen
											name="notifications"
											options={{
												//headerShown: false,
												headerStyle: {
													backgroundColor: "#000",
												},
												//header: () => { },
												headerLeft: () => (
													<Pressable
														onPress={() => router.back()}
													//className="p-2 ml-2"
													>
														<ArrowLeft color="white" size={24} />
													</Pressable>
												),
												headerTitle: "",
												//presentation: "containedModal",
											}}
										/>
									</Stack>
								</ToastProvider>
							</SafeAreaProvider>
						</PortalProvider>
					</ThemeProvider>
				</TamaguiProvider>
			</SWRConfig>
		</ErrorBoundary>
	);
}

export default Sentry.wrap(RootLayout);
