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
        name="courses"
        options={{
          title: "Courses",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-sharp" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="skills"
        options={{
          title: "Skills",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bulb-sharp" color={color} size={size} />
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

      <Tabs.Screen
        name="editProfile"
        options={{
          href: null,
          headerShown: false,
          title: "Edit Profile",
        }}
      />

      <Tabs.Screen
        name="editCourse"
        options={{
          href: null,
          headerShown: true,
          title: "Edit Course",
        }}
      />

      <Tabs.Screen
        name="addcourse"
        options={{
          href: null,
          headerShown: true,
          title: "Add Course",
        }}
      />

      <Tabs.Screen
        name="courseDetails"
        options={{
          href: null,
          headerShown: false,
          title: "Course Details",
        }}
      />

      <Tabs.Screen
        name="addSkill"
        options={{
          href: null,
          headerShown: true,
          title: "Add Skill",
        }}
      />

      <Tabs.Screen
        name="editSkill"
        options={{
          href: null,
          headerShown: true,
          title: "Edit Skill",
        }}
      />

      <Tabs.Screen
        name="skillDetails"
        options={{
          href: null,
          headerShown: false,
          title: "Skill Details",
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          href: null,
          headerShown: false,
          title: "Chat",
        }}
      />
    </Tabs>
  );
}
