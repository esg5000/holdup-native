import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { C } from "../constants/colors";

export default function StatBox({ label, value, unit, color, sub }) {
  return (
    <View style={styles.box}>
      <Text style={[styles.value, { color: color || C.text }]}>
        {value}<Text style={styles.unit}>{unit}</Text>
      </Text>
      <Text style={styles.label}>{label}</Text>
      {sub ? <Text style={[styles.sub, { color: color || C.sub }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  value: {
    fontSize: 22,
    fontWeight: "900",
    color: C.text,
    lineHeight: 26,
  },
  unit: {
    fontSize: 12,
    fontWeight: "600",
    color: C.sub,
  },
  label: {
    fontSize: 10,
    color: C.sub,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sub: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "600",
  },
});
