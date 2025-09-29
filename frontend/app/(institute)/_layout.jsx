import React, { useEffect, useState } from "react";
import { Stack, router, Tabs } from "expo-router";
import { getSession } from "../../lib/session";
import { themes } from "../../constants/colors";
import { useColorScheme, View } from "react-native";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";

export default function InstituteLayout() {
  const [checked, setChecked] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? themes.dark : themes.light;

  useEffect(() => {
    (async () => {
      const s = await getSession();
      if (!s || s.role !== "institute") {
        router.replace("/login");
        return;
      }
      setChecked(true);
    })();
  }, []);

  if (!checked) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        headerStyle: { backgroundColor: theme.card },
        headerTitleStyle: { color: theme.text },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-sharp" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="addcourse"
        options={{
          title: "Add Course",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-sharp" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-sharp" color={color} size={size} />
          ),
        }}
      />


      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-sharp" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
