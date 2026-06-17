import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { C } from "../constants/colors";

function lieColor(pct) {
  if (pct < 25) return C.danger;
  if (pct < 50) return C.warn;
  if (pct < 75) return C.accent;
  return C.safe;
}

function lieLabel(pct) {
  if (pct < 25) return "Constant liar";
  if (pct < 50) return "Usually wrong";
  if (pct < 75) return "Hit or miss";
  return "Usually honest";
}

export default function LieBar({ pct }) {
  const color = lieColor(pct);
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Wait Time Honesty</Text>
        <Text style={[styles.headerValue, { color }]}>{lieLabel(pct)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.sub}>Accurate {pct}% of the time</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  headerLabel: {
    fontSize: 11,
    color: C.sub,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  headerValue: {
    fontSize: 12,
    fontWeight: "800",
  },
  track: {
    height: 8,
    backgroundColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
  sub: {
    fontSize: 10,
    color: C.muted,
    marginTop: 3,
  },
});
