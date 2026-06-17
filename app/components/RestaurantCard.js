import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { C } from "../constants/colors";

function verdictColor(v) {
  return v === "danger" ? C.danger : v === "warn" ? C.warn : C.safe;
}
function verdictLabel(v) {
  return v === "danger" ? "AVOID" : v === "warn" ? "USE CAUTION" : "SOLID SPOT";
}
function verdictIcon(v) {
  return v === "danger" ? "🚨" : v === "warn" ? "⚠️" : "✅";
}

export default function RestaurantCard({ r, onPress }) {
  const vc = verdictColor(r.verdict);
  return (
    <TouchableOpacity style={[styles.card, r.verdict === "danger" && { borderColor: C.danger + "33" }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{r.name}</Text>
          <Text style={styles.address}>{r.address}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: vc + "18", borderColor: vc + "44" }]}>
          <Text style={[styles.badgeText, { color: vc }]}>{verdictIcon(r.verdict)} {verdictLabel(r.verdict)}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerLeft}>{r.reportCount} dasher reports</Text>
        <Text style={styles.footerRight}>{r.unassignRate}% unassign</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.3,
  },
  address: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  footerLeft: {
    fontSize: 11,
    color: C.muted,
  },
  footerRight: {
    fontSize: 11,
    color: C.sub,
    fontWeight: "600",
  },
});
