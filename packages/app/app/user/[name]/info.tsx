import { useLocalSearchParams } from "expo-router";
import React from "react";
import UserProfile from "@/components/UserProfile";

export default function UserInfo() {
  const { name } = useLocalSearchParams<{ name: string }>();
  //const [stateColor, setStateColor] = useState<string>('#2089dc');

  return (<UserProfile username={name} />)
}