import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { C } from "../constants/colors";
import { shortage } from "../utils/calculations";

export default function TripCard({ trip }) {
  const short = trip.actualMiles != null
    ? parseFloat(shortage(trip.actualMiles, trip.miles))
    : null;

  return (
    <View style={styles.card}>
      {trip.restaurantName ? (
        <Text style={styles.restaurant}>{trip.restaurantName}</Text>
      ) : null}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>DD Pay</Text>
          <Text style={[styles.cellValue, { color: C.accent }]}>${trip.pay.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>DD Miles</Text>
          <Text style={styles.cellValue}>{trip.miles}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Actual mi</Text>
          <Text style={styles.cellValue}>{trip.actualMiles != null ? trip.actualMiles : "—"}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Shortage</Text>
          <Text style={[styles.cellValue, { color: short != null && short > 0 ? C.danger : C.muted }]}>
            {short != null ? (short > 0 ? short.toFixed(1) : "0") : "—"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  restaurant: {
    fontSize: 12,
    color: C.sub,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  cell: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: C.border,
    marginHorizontal: 4,
  },
  cellLabel: {
    fontSize: 9,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cellValue: {
    fontSize: 16,
    fontWeight: "900",
    color: C.text,
  },
});
