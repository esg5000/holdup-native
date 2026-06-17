import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Switch, StyleSheet, Clipboard,
} from "react-native";
import { C } from "../constants/colors";
import StatBox from "../components/StatBox";
import {
  perMile, verdict, verdictColor, estimatedReal,
  shortage, disputeText,
} from "../utils/calculations";

export default function MilesScreen() {
  // ── Form state ──────────────────────────────────────────────────
  const [restaurant, setRestaurant] = useState("");
  const [ddPay, setDdPay] = useState("");
  const [ddMiles, setDdMiles] = useState("");
  const [actualMiles, setActualMiles] = useState("");
  const [stacked, setStacked] = useState(false);

  // ── Trips state ─────────────────────────────────────────────────
  const [trips, setTrips] = useState([]);
  const [activeDispute, setActiveDispute] = useState(null);
  const [recovered, setRecovered] = useState(0);
  const [recoveredInput, setRecoveredInput] = useState("");

  // ── UI state ────────────────────────────────────────────────────
  const [logged, setLogged] = useState(false);

  // ── Live calculations ───────────────────────────────────────────
  const payNum = parseFloat(ddPay) || 0;
  const milesNum = parseFloat(ddMiles) || 0;
  const actualNum = parseFloat(actualMiles) || 0;

  const rateRaw = milesNum > 0 && payNum > 0 ? payNum / milesNum : null;
  const rateStr = rateRaw !== null ? perMile(payNum, milesNum) : null;
  const verdictStr = rateRaw !== null ? verdict(parseFloat(rateStr)) : null;
  const vColor = rateRaw !== null ? verdictColor(parseFloat(rateStr), C) : C.sub;
  const estReal = milesNum > 0 ? estimatedReal(milesNum) : null;
  const liveShortage =
    actualNum > 0 && milesNum > 0 && actualNum > milesNum
      ? shortage(actualNum, milesNum)
      : null;

  // ── Running totals ──────────────────────────────────────────────
  const totalShorted = trips.reduce((sum, t) => (t.shortage > 0 ? sum + t.shortage : sum), 0);
  const totalPay = trips.reduce((sum, t) => sum + t.ddPay, 0);
  const totalActual = trips.reduce(
    (sum, t) => sum + (t.actualMiles !== null ? t.actualMiles : t.ddMiles * 1.3),
    0
  );
  const avgRate =
    trips.length > 0 && totalActual > 0
      ? (totalPay / totalActual).toFixed(2)
      : null;

  // ── Actions ─────────────────────────────────────────────────────
  const canLog = ddPay !== "" && ddMiles !== "";

  const logTrip = () => {
    if (!canLog) return;
    const actual = actualNum > 0 ? actualNum : null;
    const short = actual !== null ? parseFloat(shortage(actual, milesNum)) : 0;
    setTrips(prev => [
      {
        id: Date.now(),
        timestamp: Date.now(),
        restaurant,
        ddPay: payNum,
        ddMiles: milesNum,
        actualMiles: actual,
        stacked,
        shortage: short,
        rate: parseFloat(perMile(payNum, milesNum)),
      },
      ...prev,
    ]);
    setRestaurant("");
    setDdPay("");
    setDdMiles("");
    setActualMiles("");
    setStacked(false);
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  const confirmRecovered = () => {
    const val = parseFloat(recoveredInput) || 0;
    if (val > 0) setRecovered(prev => prev + val);
    setRecoveredInput("");
    setActiveDispute(null);
  };

  const formatTime = ts => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={s.title}>
          My <Text style={{ color: C.accent }}>Miles</Text>
        </Text>
        <Text style={s.subtitle}>TRACK EVERY MILE DD OWES YOU</Text>
      </View>

      {/* ── STATS ROW ── */}
      <View style={s.statsRow}>
        <StatBox
          label="Shorted"
          value={trips.length > 0 ? totalShorted.toFixed(1) : "—"}
          unit={trips.length > 0 ? "mi" : ""}
          color={totalShorted > 0 ? C.danger : C.sub}
        />
        <View style={{ width: 8 }} />
        <StatBox
          label="Recovered"
          value={`$${recovered.toFixed(0)}`}
          unit=""
          color={recovered > 0 ? C.safe : C.sub}
        />
        <View style={{ width: 8 }} />
        <StatBox
          label="Avg $/mi"
          value={avgRate !== null ? `$${avgRate}` : "—"}
          unit=""
          color={avgRate !== null ? verdictColor(parseFloat(avgRate), C) : C.sub}
        />
      </View>

      {/* ── LOG AN OFFER ── */}
      <Text style={s.sectionLabel}>LOG AN OFFER</Text>
      <View style={s.card}>

        {/* Restaurant */}
        <TextInput
          style={s.input}
          placeholder="e.g. P.F. Chang's"
          placeholderTextColor={C.muted}
          value={restaurant}
          onChangeText={setRestaurant}
        />

        {/* Pay / Miles / Stacked */}
        <View style={s.tripleRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.inputLabel}>DD PAY</Text>
            <TextInput
              style={s.input}
              placeholder="2.10"
              placeholderTextColor={C.muted}
              keyboardType="decimal-pad"
              value={ddPay}
              onChangeText={setDdPay}
            />
          </View>
          <View style={{ width: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.inputLabel}>DD MILES</Text>
            <TextInput
              style={s.input}
              placeholder="7.2"
              placeholderTextColor={C.muted}
              keyboardType="decimal-pad"
              value={ddMiles}
              onChangeText={setDdMiles}
            />
          </View>
          <View style={{ width: 8 }} />
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.inputLabel}>STACKED</Text>
            <Switch
              value={stacked}
              onValueChange={setStacked}
              trackColor={{ false: C.border, true: C.accent + "88" }}
              thumbColor={stacked ? C.accent : C.sub}
            />
          </View>
        </View>

        {/* Actual Miles */}
        <View>
          <Text style={s.inputLabel}>ACTUAL MILES</Text>
          <Text style={s.inputSub}>from Google Maps or estimate</Text>
          <TextInput
            style={s.input}
            placeholder="driven miles"
            placeholderTextColor={C.muted}
            keyboardType="decimal-pad"
            value={actualMiles}
            onChangeText={setActualMiles}
          />
        </View>

        {/* Live shortage preview */}
        {liveShortage !== null && (
          <Text style={s.liveShortage}>Shorted {liveShortage} mi</Text>
        )}

        {/* Live calc row */}
        {rateRaw !== null && (
          <View style={s.liveRow}>
            <View style={[s.liveBox, { borderColor: vColor + "44" }]}>
              <Text style={[s.liveValue, { color: vColor }]}>${rateStr}</Text>
              <Text style={s.liveBoxSub}>per mile</Text>
            </View>
            <View style={{ width: 8 }} />
            <View style={[s.liveBox, { borderColor: vColor + "44" }]}>
              <Text style={[s.liveValue, { color: vColor }]}>{verdictStr}</Text>
              <Text style={s.liveBoxSub}>verdict</Text>
            </View>
            <View style={{ width: 8 }} />
            <View style={s.liveBox}>
              <Text style={[s.liveValue, { color: C.text }]}>
                {actualNum > 0 ? actualNum.toFixed(1) : estReal}
              </Text>
              <Text style={s.liveBoxSub}>{actualNum > 0 ? "actual mi" : "est. mi"}</Text>
            </View>
          </View>
        )}

        {/* Weak offer warning */}
        {rateRaw !== null && parseFloat(rateStr) < 0.50 && (
          <Text style={s.weakWarning}>⚠️ WEAK OFFER — consider declining</Text>
        )}

        {/* Log button */}
        <TouchableOpacity
          style={[s.logBtn, !canLog && s.logBtnDisabled]}
          onPress={logTrip}
          disabled={!canLog}
        >
          <Text style={[s.logBtnText, !canLog && { color: C.muted }]}>
            {logged ? "✓ Logged" : "Log This Trip"}
          </Text>
        </TouchableOpacity>

      </View>

      {/* ── MY TRIPS ── */}
      <Text style={s.sectionLabel}>MY TRIPS</Text>

      {trips.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🚗</Text>
          <Text style={s.emptyText}>No trips yet. Log your first offer above.</Text>
        </View>
      ) : (
        trips.map(trip => {
          const isDisputing = activeDispute === trip.id;
          const tColor = verdictColor(trip.rate, C);

          return (
            <View key={trip.id} style={s.tripCard}>

              {/* Name + time */}
              <View style={s.tripTop}>
                <Text style={s.tripName} numberOfLines={1}>
                  {trip.restaurant || "Unnamed trip"}
                </Text>
                <Text style={s.tripTime}>{formatTime(trip.timestamp)}</Text>
              </View>

              {/* Metrics row */}
              <View style={s.metricsRow}>
                <View style={s.metric}>
                  <Text style={s.metricLabel}>DD PAY</Text>
                  <Text style={[s.metricValue, { color: C.accent }]}>
                    ${trip.ddPay.toFixed(2)}
                  </Text>
                </View>
                <View style={s.metricDivider} />
                <View style={s.metric}>
                  <Text style={s.metricLabel}>DD MILES</Text>
                  <Text style={s.metricValue}>{trip.ddMiles}</Text>
                </View>
                {trip.actualMiles !== null && (
                  <>
                    <View style={s.metricDivider} />
                    <View style={s.metric}>
                      <Text style={s.metricLabel}>ACTUAL</Text>
                      <Text style={s.metricValue}>{trip.actualMiles}</Text>
                    </View>
                  </>
                )}
                <View style={s.metricDivider} />
                <View style={s.metric}>
                  <Text style={s.metricLabel}>$/MI</Text>
                  <Text style={[s.metricValue, { color: tColor }]}>
                    ${trip.rate.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Shortage */}
              {trip.shortage > 0 && (
                <Text style={s.shortage}>Shorted {trip.shortage.toFixed(1)} mi</Text>
              )}

              {/* Stacked badge */}
              {trip.stacked && <Text style={s.stackedBadge}>STACKED</Text>}

              {/* Dispute toggle */}
              <TouchableOpacity
                style={[s.disputeBtn, isDisputing && s.disputeBtnActive]}
                onPress={() => {
                  setActiveDispute(isDisputing ? null : trip.id);
                  setRecoveredInput("");
                }}
              >
                <Text style={[s.disputeBtnText, isDisputing && { color: C.danger }]}>
                  {isDisputing ? "Close" : "Dispute?"}
                </Text>
              </TouchableOpacity>

              {/* Dispute panel */}
              {isDisputing && (
                <View style={s.disputePanel}>
                  <Text style={s.disputePanelLabel}>READ TO SUPPORT</Text>
                  <Text style={s.disputeScript}>
                    {disputeText(
                      trip.restaurant || "this restaurant",
                      trip.ddMiles,
                      trip.actualMiles !== null
                        ? trip.actualMiles
                        : parseFloat(estimatedReal(trip.ddMiles))
                    )}
                  </Text>
                  <TouchableOpacity
                    style={s.copyBtn}
                    onPress={() =>
                      Clipboard.setString(
                        disputeText(
                          trip.restaurant || "this restaurant",
                          trip.ddMiles,
                          trip.actualMiles !== null
                            ? trip.actualMiles
                            : parseFloat(estimatedReal(trip.ddMiles))
                        )
                      )
                    }
                  >
                    <Text style={s.copyBtnText}>Copy Text</Text>
                  </TouchableOpacity>
                  <Text style={s.recoverLabel}>Mark Recovered ($)</Text>
                  <View style={s.recoverRow}>
                    <TextInput
                      style={s.recoverInput}
                      placeholder="0.00"
                      placeholderTextColor={C.muted}
                      keyboardType="decimal-pad"
                      value={recoveredInput}
                      onChangeText={setRecoveredInput}
                    />
                    <TouchableOpacity style={s.recoverBtn} onPress={confirmRecovered}>
                      <Text style={s.recoverBtnText}>✓ Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: C.sub,
    letterSpacing: 1,
    marginTop: 3,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    color: C.sub,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },

  // Form card
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    gap: 10,
  },

  // Inputs
  input: {
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputLabel: {
    fontSize: 10,
    color: C.muted,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  inputSub: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 4,
    marginTop: -2,
  },
  tripleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  // Live calc
  liveShortage: {
    fontSize: 13,
    fontWeight: "800",
    color: C.danger,
    marginTop: -2,
  },
  liveRow: {
    flexDirection: "row",
  },
  liveBox: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  liveValue: {
    fontSize: 17,
    fontWeight: "900",
  },
  liveBoxSub: {
    fontSize: 9,
    color: C.sub,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 3,
  },
  weakWarning: {
    fontSize: 13,
    fontWeight: "800",
    color: C.danger,
    textAlign: "center",
  },

  // Log button
  logBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  logBtnDisabled: {
    backgroundColor: C.border,
  },
  logBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 0.3,
  },

  // Empty state
  empty: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: C.sub,
    textAlign: "center",
  },

  // Trip cards
  tripCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
    gap: 8,
  },
  tripTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    flex: 1,
    marginRight: 8,
  },
  tripTime: {
    fontSize: 11,
    color: C.muted,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metric: {
    flex: 1,
    alignItems: "center",
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: C.border,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 9,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "900",
    color: C.text,
  },
  shortage: {
    fontSize: 13,
    fontWeight: "800",
    color: C.danger,
  },
  stackedBadge: {
    fontSize: 10,
    color: C.accent,
    fontWeight: "700",
    backgroundColor: C.accent + "18",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.accent + "33",
  },

  // Dispute
  disputeBtn: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
    alignSelf: "flex-end",
  },
  disputeBtnActive: {
    borderColor: C.danger + "66",
    backgroundColor: C.danger + "18",
  },
  disputeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.sub,
  },
  disputePanel: {
    backgroundColor: C.danger + "0c",
    borderWidth: 1,
    borderColor: C.danger + "33",
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  disputePanelLabel: {
    fontSize: 10,
    color: C.danger,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  disputeScript: {
    fontSize: 13,
    color: C.text,
    lineHeight: 20,
    fontStyle: "italic",
  },
  copyBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  copyBtnText: {
    fontSize: 11,
    color: C.sub,
    fontWeight: "600",
  },
  recoverLabel: {
    fontSize: 11,
    color: C.sub,
    fontWeight: "600",
  },
  recoverRow: {
    flexDirection: "row",
    gap: 8,
  },
  recoverInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: C.safe + "55",
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recoverBtn: {
    backgroundColor: C.safe,
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 6,
    justifyContent: "center",
  },
  recoverBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000",
  },
});
