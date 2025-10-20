import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, useColorScheme } from "react-native";
import { themes } from '../../constants/colors'
import { getSession } from "../../lib/session";

export default function Reports() {
    const scheme = useColorScheme();
    const theme = scheme === "dark" ? themes.dark : themes.light;
      
  return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>View reports Here.</Text>
      </View> 
    )
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
})