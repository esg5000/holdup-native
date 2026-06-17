import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { C } from "../constants/colors";

export default function MilesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Miles Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: C.sub,
    fontSize: 16,
    fontWeight: "600",
  },
});
