import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Switch, StyleSheet, Clipboard,
  Alert, Animated,
} from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { C } from "../constants/colors";
import StatBox from "../components/StatBox";
import {
  perMile, verdict, verdictColor, estimatedReal,
  shortage, disputeText,
} from "../utils/calculations";

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function MilesScreen() {
  // ── Form state ──────────────────────────────────────────────────
  const [restaurant, setRestaurant] = useState("");
  const [ddPay, setDdPay] = useState("");
  const [ddMiles, setDdMiles] = useState("");
  const [actualMiles, setActualMiles] = useState("");
  const [stacked, setStacked] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // ── Trips state ─────────────────────────────────────────────────
  const [trips, setTrips] = useState([]);
  const [activeDispute, setActiveDispute] = useState(null);
  const [recovered, setRecovered] = useState(0);
  const [recoveredInput, setRecoveredInput] = useState("");

  // ── Tracker state ────────────────────────────────────────────────
  const [isTracking, setIsTracking] = useState(false);
  const [trackedMiles, setTrackedMiles] = useState(0);
  const [trackingCoords, setTrackingCoords] = useState([]);
  const [locationSub, setLocationSub] = useState(null);
  const [lockedOffer, setLockedOffer] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [resultDisputeOpen, setResultDisputeOpen] = useState(false);
  const coordsRef = useRef([]);
  const milesRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isTracking]);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(micPulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      micPulseAnim.stopAnimation();
      micPulseAnim.setValue(1);
    }
  }, [isListening]);

  useEffect(() => {
    return () => { if (locationSub) locationSub.remove(); };
  }, [locationSub]);

  // ── Tracker actions ──────────────────────────────────────────────
  const startTrip = async () => {
    if (ddPay === "" || ddMiles === "") {
      Alert.alert(
        "Missing Info",
        "Enter DD Pay and DD Miles first so we can evaluate your trip."
      );
      return;
    }

    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== "granted") {
      Alert.alert("Permission Required", "Location permission required to track miles");
      return;
    }
    await Location.requestBackgroundPermissionsAsync();

    const offer = {
      restaurant,
      ddPay: parseFloat(ddPay),
      ddMiles: parseFloat(ddMiles),
      stacked,
    };
    setLockedOffer(offer);

    coordsRef.current = [];
    milesRef.current = 0;
    setTrackingCoords([]);
    setTrackedMiles(0);
    setLastResult(null);
    setResultDisputeOpen(false);
    setIsTracking(true);

    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 0 },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        const prev = coordsRef.current;
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          milesRef.current += haversine(last.latitude, last.longitude, latitude, longitude);
          setTrackedMiles(milesRef.current);
        }
        coordsRef.current = [...prev, { latitude, longitude }];
        setTrackingCoords(coordsRef.current);
      }
    );
    setLocationSub(sub);
  };

  const endTrip = () => {
    if (locationSub) {
      locationSub.remove();
      setLocationSub(null);
    }
    setIsTracking(false);

    const gpsMiles = milesRef.current;
    const offer = lockedOffer;
    const actualMi = parseFloat(gpsMiles.toFixed(1));
    const rateBase = actualMi > 0 ? actualMi : offer.ddMiles;
    const short = actualMi > offer.ddMiles
      ? parseFloat(shortage(actualMi, offer.ddMiles))
      : 0;
    const rate = parseFloat(perMile(offer.ddPay, rateBase));

    const newTrip = {
      id: Date.now(),
      timestamp: Date.now(),
      restaurant: offer.restaurant,
      ddPay: offer.ddPay,
      ddMiles: offer.ddMiles,
      actualMiles: actualMi,
      stacked: offer.stacked,
      shortage: short,
      rate,
    };

    setTrips(prev => [newTrip, ...prev]);
    setLastResult(newTrip);

    coordsRef.current = [];
    milesRef.current = 0;
    setTrackedMiles(0);
    setTrackingCoords([]);
  };

  const resetForNextTrip = () => {
    setLastResult(null);
    setLockedOffer(null);
    setResultDisputeOpen(false);
    setRestaurant("");
    setDdPay("");
    setDdMiles("");
    setActualMiles("");
    setStacked(false);
  };

  // ── Live calculations (LOG AN OFFER form) ───────────────────────
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

  // ── Locked offer display helpers ─────────────────────────────────
  const lockedRate = lockedOffer
    ? parseFloat(perMile(lockedOffer.ddPay, lockedOffer.ddMiles))
    : 0;
  const lockedVerdictStr = lockedOffer ? verdict(lockedRate) : null;
  const lockedVColor = lockedOffer ? verdictColor(lockedRate, C) : C.sub;

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

      {/* ── LOG AN OFFER — only shown when idle ── */}
      {!isTracking && !lastResult && (
        <>
          <Text style={s.sectionLabel}>LOG AN OFFER</Text>
          <View style={s.card}>

            <TextInput
              style={s.input}
              placeholder="e.g. P.F. Chang's"
              placeholderTextColor={C.muted}
              value={restaurant}
              onChangeText={setRestaurant}
            />

            <TouchableOpacity
              style={[s.micBtn, isListening && s.micBtnActive]}
              onPress={() => setIsListening(v => !v)}
            >
              {isListening ? (
                <Animated.View style={[s.micDot, { opacity: micPulseAnim }]} />
              ) : (
                <Text style={s.micIcon}>🎤</Text>
              )}
              <Text style={[s.micBtnText, isListening && s.micBtnTextActive]}>
                {isListening ? "Listening..." : "Tap to speak your offer"}
              </Text>
            </TouchableOpacity>

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

            {liveShortage !== null && (
              <Text style={s.liveShortage}>Shorted {liveShortage} mi</Text>
            )}

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

            {rateRaw !== null && parseFloat(rateStr) < 0.50 && (
              <Text style={s.weakWarning}>⚠️ WEAK OFFER — consider declining</Text>
            )}

          </View>
        </>
      )}

      {/* ── TRIP TRACKER ── */}
      <Text style={s.sectionLabel}>
        {lastResult ? "TRIP RESULT" : "TRIP TRACKER"}
      </Text>
      <View style={s.card}>

        {/* ── Results state ── */}
        {lastResult && (
          <>
            <Text style={s.resultsName}>
              {lastResult.restaurant || "Unknown restaurant"}
            </Text>

            <View style={s.metricsRow}>
              <View style={s.metric}>
                <Text style={s.metricLabel}>DD PAY</Text>
                <Text style={[s.metricValue, { color: C.accent }]}>
                  ${lastResult.ddPay.toFixed(2)}
                </Text>
              </View>
              <View style={s.metricDivider} />
              <View style={s.metric}>
                <Text style={s.metricLabel}>DD MILES</Text>
                <Text style={s.metricValue}>{lastResult.ddMiles}</Text>
              </View>
              <View style={s.metricDivider} />
              <View style={s.metric}>
                <Text style={s.metricLabel}>ACTUAL</Text>
                <Text style={s.metricValue}>{lastResult.actualMiles}</Text>
              </View>
              <View style={s.metricDivider} />
              <View style={s.metric}>
                <Text style={s.metricLabel}>$/MI</Text>
                <Text style={[s.metricValue, { color: verdictColor(lastResult.rate, C) }]}>
                  ${lastResult.rate.toFixed(2)}
                </Text>
              </View>
            </View>

            {lastResult.shortage > 0 && (
              <Text style={s.shortage}>
                Shorted {lastResult.shortage.toFixed(1)} mi
              </Text>
            )}

            {lastResult.shortage > 0.5 && (
              <TouchableOpacity
                style={[s.disputeBtn, resultDisputeOpen && s.disputeBtnActive]}
                onPress={() => setResultDisputeOpen(v => !v)}
              >
                <Text style={[s.disputeBtnText, resultDisputeOpen && { color: C.danger }]}>
                  {resultDisputeOpen ? "Close" : "DISPUTE?"}
                </Text>
              </TouchableOpacity>
            )}

            {resultDisputeOpen && (
              <View style={s.disputePanel}>
                <Text style={s.disputePanelLabel}>READ TO SUPPORT</Text>
                <Text style={s.disputeScript}>
                  {disputeText(
                    lastResult.restaurant || "this restaurant",
                    lastResult.ddMiles,
                    lastResult.actualMiles
                  )}
                </Text>
                <TouchableOpacity
                  style={s.copyBtn}
                  onPress={() =>
                    Clipboard.setString(
                      disputeText(
                        lastResult.restaurant || "this restaurant",
                        lastResult.ddMiles,
                        lastResult.actualMiles
                      )
                    )
                  }
                >
                  <Text style={s.copyBtnText}>Copy Text</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={s.newTripBtn} onPress={resetForNextTrip}>
              <Text style={s.newTripBtnText}>Start New Trip</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Tracking state ── */}
        {isTracking && (
          <>
            <View style={s.trackingHeader}>
              <Animated.View style={[s.trackingDot, { opacity: pulseAnim }]} />
              <Text style={s.trackingLabel}>TRACKING</Text>
            </View>

            {/* Locked offer summary */}
            {lockedOffer && (
              <View style={s.lockedCard}>
                <Text style={s.lockedName} numberOfLines={1}>
                  {lockedOffer.restaurant || "Unknown restaurant"}
                </Text>
                <View style={s.lockedRow}>
                  <Text style={s.lockedPay}>${lockedOffer.ddPay.toFixed(2)}</Text>
                  <Text style={s.lockedMiles}>{lockedOffer.ddMiles} mi stated</Text>
                  <View style={[
                    s.verdictBadge,
                    { backgroundColor: lockedVColor + "22", borderColor: lockedVColor + "55" },
                  ]}>
                    <Text style={[s.verdictBadgeText, { color: lockedVColor }]}>
                      {lockedVerdictStr}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={s.odometer}>{trackedMiles.toFixed(1)}</Text>
            <Text style={s.odometerUnit}>mi tracked</Text>

            <Text style={s.trackingHint}>Tap END TRIP when you reach the customer</Text>

            <TouchableOpacity style={s.endBtn} onPress={endTrip}>
              <Text style={s.endBtnText}>END TRIP</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Idle state ── */}
        {!isTracking && !lastResult && (
          <TouchableOpacity style={s.startBtn} onPress={startTrip}>
            <Text style={s.startBtnText}>START TRIP</Text>
          </TouchableOpacity>
        )}

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

              <View style={s.tripTop}>
                <Text style={s.tripName} numberOfLines={1}>
                  {trip.restaurant || "Unnamed trip"}
                </Text>
                <Text style={s.tripTime}>{formatTime(trip.timestamp)}</Text>
              </View>

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

              {trip.shortage > 0 && (
                <Text style={s.shortage}>Shorted {trip.shortage.toFixed(1)} mi</Text>
              )}

              {trip.stacked && <Text style={s.stackedBadge}>STACKED</Text>}

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

  // Card (shared)
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

  // Voice input
  micBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 52,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  micBtnActive: {
    backgroundColor: C.danger + "22",
    borderColor: C.danger,
  },
  micIcon: {
    fontSize: 20,
  },
  micDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.danger,
  },
  micBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.sub,
  },
  micBtnTextActive: {
    fontWeight: "700",
    color: C.danger,
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

  // Tracker — idle
  startBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 0.5,
  },

  // Tracker — active
  endBtn: {
    backgroundColor: C.danger,
    borderRadius: 10,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  endBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  trackingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trackingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.safe,
  },
  trackingLabel: {
    fontSize: 11,
    color: C.safe,
    fontWeight: "700",
    letterSpacing: 1,
  },
  lockedCard: {
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    gap: 5,
  },
  lockedName: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lockedPay: {
    fontSize: 14,
    fontWeight: "900",
    color: C.accent,
  },
  lockedMiles: {
    fontSize: 12,
    color: C.sub,
    flex: 1,
  },
  verdictBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  verdictBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  odometer: {
    fontSize: 52,
    fontWeight: "900",
    color: C.accent,
    textAlign: "center",
    letterSpacing: -2,
  },
  odometerUnit: {
    fontSize: 13,
    color: C.sub,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: -4,
  },
  trackingHint: {
    fontSize: 11,
    color: C.muted,
    textAlign: "center",
  },

  // Tracker — results
  resultsName: {
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
  },
  newTripBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  newTripBtnText: {
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
