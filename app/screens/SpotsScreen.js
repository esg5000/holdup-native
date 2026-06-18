import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, FlatList, Modal, Alert, StyleSheet,
} from "react-native";
import { C } from "../constants/colors";

// ── Mock data ────────────────────────────────────────────────────
const RESTAURANTS = [
  {
    id: 1, name: "Black Angus", address: "7507 W Bell Rd, Glendale AZ",
    cuisine: "Steakhouse", verdict: "danger", avgWait: 26, lieScore: 14,
    stolenOrders: 11, respDumps: 4, unassignRate: 34, reportCount: 78,
    tags: ["always late", "stolen orders", "constant liar"],
    recentReports: [
      { id: 1, ago: "18m", wait: 31, stated: 5, stolen: true, dump: false, note: "Third time this month — order already picked up." },
      { id: 2, ago: "2h", wait: 24, stated: 3, stolen: false, dump: true, note: "Asked me to call the customer about a substitution. Not my job." },
      { id: 3, ago: "5h", wait: 28, stated: 8, stolen: false, dump: false, note: "Said 8 min. Watched them fire the grill when I walked in." },
    ],
  },
  {
    id: 2, name: "Burger Palace", address: "1420 W McDowell Rd, Phoenix AZ",
    cuisine: "Fast Food", verdict: "warn", avgWait: 19, lieScore: 41,
    stolenOrders: 3, respDumps: 6, unassignRate: 21, reportCount: 54,
    tags: ["hit or miss", "usually wrong"],
    recentReports: [
      { id: 1, ago: "1h", wait: 22, stated: 10, stolen: false, dump: true, note: "They're bagging it — no they weren't. Still on the line." },
      { id: 2, ago: "4h", wait: 17, stated: 12, stolen: false, dump: false, note: "Saturday nights are brutal here." },
    ],
  },
  {
    id: 3, name: "Golden Dragon", address: "3302 N 24th St, Phoenix AZ",
    cuisine: "Chinese", verdict: "danger", avgWait: 23, lieScore: 9,
    stolenOrders: 2, respDumps: 7, unassignRate: 29, reportCount: 41,
    tags: ["tiny kitchen", "always late", "lied about wait"],
    recentReports: [
      { id: 1, ago: "3h", wait: 27, stated: 5, stolen: false, dump: true, note: "Three dashers already waiting. Tiny kitchen." },
      { id: 2, ago: "6h", wait: 19, stated: 3, stolen: false, dump: false, note: "Said 3 min every single time. Never 3 min." },
    ],
  },
  {
    id: 4, name: "Crumbl Cookies", address: "9898 W Thunderbird Rd, Peoria AZ",
    cuisine: "Bakery", verdict: "warn", avgWait: 8, lieScore: 68,
    stolenOrders: 0, respDumps: 9, unassignRate: 12, reportCount: 29,
    tags: ["responsibility dump", "made me contact customer"],
    recentReports: [
      { id: 1, ago: "2h", wait: 6, stated: 5, stolen: false, dump: true, note: "Short on cookies, asked me to contact customer. Not my job." },
      { id: 2, ago: "1d", wait: 10, stated: 8, stolen: false, dump: true, note: "Manager handed me her phone to call the customer. I left." },
    ],
  },
  {
    id: 5, name: "Sushi Zen", address: "3210 E Camelback Rd, Phoenix AZ",
    cuisine: "Japanese", verdict: "safe", avgWait: 4, lieScore: 91,
    stolenOrders: 0, respDumps: 0, unassignRate: 2, reportCount: 97,
    tags: ["fast pickup", "always ready", "honest wait times"],
    recentReports: [
      { id: 1, ago: "30m", wait: 4, stated: 5, stolen: false, dump: false, note: "Bagged and ready before I checked in. These people get it." },
      { id: 2, ago: "3h", wait: 3, stated: 3, stolen: false, dump: false, note: "Best pickup on my route. Consistent every time." },
    ],
  },
  {
    id: 6, name: "Raising Cane's", address: "2210 W Happy Valley Rd, Phoenix AZ",
    cuisine: "Fast Food", verdict: "safe", avgWait: 6, lieScore: 84,
    stolenOrders: 0, respDumps: 1, unassignRate: 4, reportCount: 63,
    tags: ["fast pickup", "honest wait times"],
    recentReports: [
      { id: 1, ago: "1h", wait: 7, stated: 8, stolen: false, dump: false, note: "They over-estimate so you're never waiting. Smart." },
    ],
  },
];

const REPORT_TAGS = [
  { key: "lied_wait", label: "Lied about wait", icon: "🕐" },
  { key: "just_fired", label: "Just fired it up", icon: "🔥" },
  { key: "3plus_wait", label: "3+ dashers waiting", icon: "👥" },
  { key: "stolen", label: "Order already picked up", icon: "🚨" },
  { key: "wrong_order", label: "Wrong order", icon: "❌" },
  { key: "dumped", label: "Made me contact customer", icon: "📞" },
  { key: "tiny_kitchen", label: "Tiny kitchen", icon: "🍳" },
  { key: "honest", label: "Told me straight", icon: "✅" },
  { key: "ready_early", label: "Order ready early", icon: "⚡" },
];

// ── Helpers ──────────────────────────────────────────────────────
const verdictColor = (v, C) => v === "danger" ? C.danger : v === "warn" ? C.warn : C.safe;
const verdictLabel = (v) => v === "danger" ? "AVOID" : v === "warn" ? "CAUTION" : "SOLID";
const verdictIcon = (v) => v === "danger" ? "🚨" : v === "warn" ? "⚠️" : "✅";
const lieLabel = (pct) => pct < 25 ? "Constant liar" : pct < 50 ? "Usually wrong" : pct < 75 ? "Hit or miss" : "Usually honest";
const lieColor = (pct, C) => pct < 25 ? C.danger : pct < 50 ? C.warn : pct < 75 ? C.accent : C.safe;

const waitColor = (min, C) => min > 20 ? C.danger : min > 10 ? C.warn : C.safe;
const stolenColor = (n, C) => n > 5 ? C.danger : n > 1 ? C.warn : C.safe;

export default function SpotsScreen() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [restaurants] = useState(RESTAURANTS);
  const [reportTags, setReportTags] = useState([]);
  const [statedWait, setStatedWait] = useState("");
  const [actualWait, setActualWait] = useState("");
  const [reportNote, setReportNote] = useState("");

  // ── Derived ──────────────────────────────────────────────────────
  const avoidCount = restaurants.filter(r => r.verdict === "danger").length;
  const solidCount = restaurants.filter(r => r.verdict === "safe").length;
  const avgHonesty = Math.round(
    restaurants.reduce((sum, r) => sum + r.lieScore, 0) / restaurants.length
  );

  const filtered = restaurants.filter(r => {
    const matchFilter = filter === "all" || r.verdict === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // ── Report form ──────────────────────────────────────────────────
  const statedNum = parseFloat(statedWait) || 0;
  const actualNum = parseFloat(actualWait) || 0;
  const lieDiff =
    actualNum > 0 && statedNum > 0 && actualNum > statedNum * 1.5
      ? Math.round(actualNum - statedNum)
      : null;

  const toggleTag = (key) => {
    setReportTags(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const resetReport = () => {
    setStatedWait("");
    setActualWait("");
    setReportNote("");
    setReportTags([]);
  };

  const submitReport = () => {
    Alert.alert(
      "Report Submitted",
      "You just helped every dasher in this zone.",
      [{
        text: "OK", onPress: () => {
          setShowReport(false);
          setSelected(null);
          resetReport();
        },
      }]
    );
  };

  const closeDetail = () => {
    setSelected(null);
    setShowReport(false);
    resetReport();
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <View style={s.screen}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>
            <Text style={{ color: C.accent }}>Hold</Text>
            <Text style={{ color: C.text }}>Up</Text>
          </Text>
          <Text style={s.subtitle}>KNOW BEFORE YOU GO</Text>
        </View>
        <View style={s.cityRow}>
          <View style={s.dot} />
          <Text style={s.cityText}>Phoenix AZ</Text>
        </View>
      </View>

      {/* ── CITY STATS STRIP ── */}
      <View style={s.statsStrip}>
        <View style={s.statCell}>
          <Text style={[s.statNum, { color: C.danger }]}>{avoidCount}</Text>
          <Text style={s.statLabel}>AVOID</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCell}>
          <Text style={[s.statNum, { color: C.safe }]}>{solidCount}</Text>
          <Text style={s.statLabel}>SOLID</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCell}>
          <Text style={[s.statNum, { color: lieColor(avgHonesty, C) }]}>
            {avgHonesty}%
          </Text>
          <Text style={s.statLabel}>AVG HONESTY</Text>
        </View>
      </View>

      {/* ── SEARCH ── */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Restaurant name or address..."
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ── FILTER PILLS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.pillsRow}
        contentContainerStyle={s.pillsContent}
      >
        {[
          { key: "all", label: "All" },
          { key: "danger", label: "🚨 Avoid" },
          { key: "warn", label: "⚠️ Caution" },
          { key: "safe", label: "✅ Solid" },
        ].map(p => (
          <TouchableOpacity
            key={p.key}
            style={[s.pill, filter === p.key && s.pillActive]}
            onPress={() => setFilter(p.key)}
          >
            <Text style={[s.pillText, filter === p.key && s.pillTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── RESTAURANT LIST ── */}
      <FlatList
        style={s.list}
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyText}>
              No results. Be the first to report this spot.
            </Text>
          </View>
        }
        renderItem={({ item: r }) => {
          const vc = verdictColor(r.verdict, C);
          return (
            <TouchableOpacity
              style={[
                s.rCard,
                r.verdict === "danger" && { borderColor: C.danger + "33" },
              ]}
              onPress={() => setSelected(r)}
              activeOpacity={0.8}
            >
              {/* Top row */}
              <View style={s.rTop}>
                <View style={s.rTopLeft}>
                  <Text style={s.rName}>{r.name}</Text>
                  <Text style={s.rAddress}>{r.address}</Text>
                </View>
                <View style={[
                  s.vBadge,
                  { backgroundColor: vc + "18", borderColor: vc + "44" },
                ]}>
                  <Text style={[s.vBadgeText, { color: vc }]}>
                    {verdictIcon(r.verdict)} {verdictLabel(r.verdict)}
                  </Text>
                </View>
              </View>

              {/* Stats row */}
              <View style={s.rStats}>
                <View style={s.rStatBox}>
                  <Text style={[s.rStatNum, { color: waitColor(r.avgWait, C) }]}>
                    {r.avgWait}m
                  </Text>
                  <Text style={s.rStatLabel}>AVG WAIT</Text>
                </View>
                <View style={s.rStatBox}>
                  <Text style={[s.rStatNum, { color: stolenColor(r.stolenOrders, C) }]}>
                    {r.stolenOrders}
                  </Text>
                  <Text style={s.rStatLabel}>STOLEN</Text>
                </View>
                <View style={s.rStatBox}>
                  <Text style={[
                    s.rStatNum,
                    { color: r.respDumps > 4 ? C.warn : C.sub },
                  ]}>
                    {r.respDumps}
                  </Text>
                  <Text style={s.rStatLabel}>DUMPED</Text>
                </View>
              </View>

              {/* Lie bar */}
              <View>
                <View style={s.lieBarHeader}>
                  <Text style={s.lieBarTitle}>WAIT TIME HONESTY</Text>
                  <Text style={[s.lieBarRight, { color: lieColor(r.lieScore, C) }]}>
                    {lieLabel(r.lieScore)}
                  </Text>
                </View>
                <View style={s.lieTrack}>
                  <View style={[
                    s.lieFill,
                    { width: `${r.lieScore}%`, backgroundColor: lieColor(r.lieScore, C) },
                  ]} />
                </View>
              </View>

              {/* Footer */}
              <View style={s.rFooter}>
                <Text style={s.rFooterLeft}>{r.reportCount} reports</Text>
                <Text style={s.rFooterRight}>
                  {r.unassignRate}% unassign · tap for details
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── DETAIL MODAL ── */}
      <Modal
        visible={selected !== null}
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <View style={s.modalScreen}>
          {selected && (
            <>
              {/* Modal header */}
              <View style={s.modalHeader}>
                <View style={s.modalHeaderText}>
                  <Text style={s.modalTitle} numberOfLines={1}>{selected.name}</Text>
                  <Text style={s.modalAddress}>{selected.address}</Text>
                </View>
                <TouchableOpacity style={s.closeBtn} onPress={closeDetail}>
                  <Text style={s.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={s.modalScroll}>

                {/* Verdict banner */}
                <View style={[
                  s.verdictBanner,
                  {
                    backgroundColor: verdictColor(selected.verdict, C) + "22",
                    borderColor: verdictColor(selected.verdict, C) + "44",
                  },
                ]}>
                  <Text style={s.verdictBannerIcon}>{verdictIcon(selected.verdict)}</Text>
                  <View style={s.verdictBannerBody}>
                    <Text style={[s.verdictBannerLabel, { color: verdictColor(selected.verdict, C) }]}>
                      {verdictLabel(selected.verdict)}
                    </Text>
                    <Text style={s.verdictBannerSub}>
                      {selected.reportCount} reports · {selected.unassignRate}% unassign rate
                    </Text>
                  </View>
                </View>

                {/* Stats grid */}
                <View style={s.detailStats}>
                  <View style={s.detailStatBox}>
                    <Text style={[s.detailStatNum, { color: waitColor(selected.avgWait, C) }]}>
                      {selected.avgWait}m
                    </Text>
                    <Text style={s.detailStatLabel}>AVG WAIT</Text>
                    <Text style={s.detailStatSub}>
                      {selected.avgWait > 20
                        ? "Kill your hour"
                        : selected.avgWait > 10
                        ? "Eats into time"
                        : "In & out"}
                    </Text>
                  </View>
                  <View style={s.detailStatBox}>
                    <Text style={[s.detailStatNum, { color: stolenColor(selected.stolenOrders, C) }]}>
                      {selected.stolenOrders}
                    </Text>
                    <Text style={s.detailStatLabel}>STOLEN</Text>
                    <Text style={s.detailStatSub}>
                      {selected.stolenOrders > 5
                        ? "High risk"
                        : selected.stolenOrders > 1
                        ? "Happened before"
                        : "Clean"}
                    </Text>
                  </View>
                  <View style={s.detailStatBox}>
                    <Text style={[
                      s.detailStatNum,
                      { color: selected.respDumps > 4 ? C.warn : C.sub },
                    ]}>
                      {selected.respDumps}
                    </Text>
                    <Text style={s.detailStatLabel}>DUMPED</Text>
                    <Text style={s.detailStatSub}>
                      {selected.respDumps > 4 ? "Watch out" : "Rare"}
                    </Text>
                  </View>
                </View>

                {/* Lie bar — full */}
                <View style={s.detailCard}>
                  <View style={s.lieBarHeader}>
                    <Text style={s.lieBarTitle}>WAIT TIME HONESTY</Text>
                    <Text style={[s.lieBarRight, { color: lieColor(selected.lieScore, C) }]}>
                      {lieLabel(selected.lieScore)}
                    </Text>
                  </View>
                  <View style={s.lieTrack}>
                    <View style={[
                      s.lieFill,
                      {
                        width: `${selected.lieScore}%`,
                        backgroundColor: lieColor(selected.lieScore, C),
                      },
                    ]} />
                  </View>
                  <Text style={s.lieAccurate}>
                    Accurate {selected.lieScore}% of the time
                  </Text>
                </View>

                {/* Unassign meter */}
                <View style={s.detailCard}>
                  <View style={[
                    s.unassignRow,
                    {
                      backgroundColor: verdictColor(selected.verdict, C) + "18",
                      borderColor: verdictColor(selected.verdict, C) + "44",
                    },
                  ]}>
                    <Text style={s.unassignCarIcon}>🚗</Text>
                    <Text style={[s.unassignRate, { color: verdictColor(selected.verdict, C) }]}>
                      {selected.unassignRate}%
                    </Text>
                    <Text style={s.unassignLabel}>of dashers unassign after arriving</Text>
                  </View>
                </View>

                {/* Recent reports */}
                <Text style={s.reportsHeader}>Recent Dasher Reports</Text>
                {selected.recentReports.map(rep => (
                  <View key={rep.id} style={s.repCard}>
                    {(rep.stolen || rep.dump) && (
                      <View style={s.repBadges}>
                        {rep.stolen && (
                          <View style={[
                            s.repBadge,
                            { backgroundColor: C.danger + "22", borderColor: C.danger + "44" },
                          ]}>
                            <Text style={[s.repBadgeText, { color: C.danger }]}>🚨 Stolen</Text>
                          </View>
                        )}
                        {rep.dump && (
                          <View style={[
                            s.repBadge,
                            { backgroundColor: C.warn + "22", borderColor: C.warn + "44" },
                          ]}>
                            <Text style={[s.repBadgeText, { color: C.warn }]}>📞 Dumped</Text>
                          </View>
                        )}
                      </View>
                    )}
                    <View style={s.waitComp}>
                      <Text style={s.waitSaid}>Said {rep.stated}m</Text>
                      <Text style={s.waitArrow}>→</Text>
                      <Text style={[
                        s.waitActual,
                        { color: rep.wait > rep.stated * 1.5 ? C.danger : C.text },
                      ]}>
                        Actual {rep.wait}m
                      </Text>
                      {rep.wait > rep.stated * 1.5 && (
                        <Text style={[s.waitShort, { color: C.danger }]}>
                          (+{Math.round(rep.wait - rep.stated)}m)
                        </Text>
                      )}
                    </View>
                    <Text style={s.repNote}>{rep.note}</Text>
                    <Text style={s.repAgo}>{rep.ago} ago</Text>
                  </View>
                ))}

              </ScrollView>

              {/* Report button */}
              <View style={s.detailFooter}>
                <TouchableOpacity
                  style={s.reportBtn}
                  onPress={() => setShowReport(true)}
                >
                  <Text style={s.reportBtnText}>I just left this spot — report it</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* ── REPORT MODAL ── */}
      <Modal
        visible={showReport}
        animationType="slide"
        onRequestClose={() => setShowReport(false)}
      >
        <View style={s.modalScreen}>
          {/* Header */}
          <View style={s.modalHeader}>
            <View style={s.modalHeaderText}>
              <Text style={s.modalTitle}>Report This Spot</Text>
              {selected && (
                <Text style={s.modalAddress}>{selected.name}</Text>
              )}
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowReport(false)}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.modalScroll}>

            {/* Wait time card */}
            <View style={s.reportSection}>
              <Text style={s.reportSectionTitle}>WAIT TIME — THE TRUTH</Text>
              <View style={s.waitInputRow}>
                <View style={s.waitInputCell}>
                  <Text style={s.inputLabel}>They said (min)</Text>
                  <TextInput
                    style={s.numInput}
                    keyboardType="number-pad"
                    placeholder="5"
                    placeholderTextColor={C.muted}
                    value={statedWait}
                    onChangeText={setStatedWait}
                  />
                </View>
                <Text style={s.waitArrowBig}>→</Text>
                <View style={s.waitInputCell}>
                  <Text style={s.inputLabel}>Actual wait (min)*</Text>
                  <TextInput
                    style={s.numInput}
                    keyboardType="number-pad"
                    placeholder="22"
                    placeholderTextColor={C.muted}
                    value={actualWait}
                    onChangeText={setActualWait}
                  />
                </View>
              </View>
              {lieDiff !== null && (
                <Text style={[s.lieDiffText, { color: C.danger }]}>
                  🔥 They lied by {lieDiff} minutes
                </Text>
              )}
            </View>

            {/* Tags */}
            <View style={s.reportSection}>
              <Text style={s.reportSectionTitle}>WHAT HAPPENED</Text>
              <View style={s.tagsGrid}>
                {REPORT_TAGS.map(tag => {
                  const isActive = reportTags.includes(tag.key);
                  const isGood = tag.key === "honest" || tag.key === "ready_early";
                  const activeColor = isGood ? C.safe : C.danger;
                  return (
                    <TouchableOpacity
                      key={tag.key}
                      style={[
                        s.tagPill,
                        isActive && {
                          backgroundColor: activeColor + "22",
                          borderColor: activeColor + "66",
                        },
                      ]}
                      onPress={() => toggleTag(tag.key)}
                    >
                      <Text style={[
                        s.tagPillText,
                        isActive && { color: activeColor },
                      ]}>
                        {tag.icon} {tag.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Note */}
            <View style={s.reportSection}>
              <Text style={s.reportSectionTitle}>TELL OTHER DASHERS</Text>
              <TextInput
                style={s.noteInput}
                placeholder="What actually happened in that lobby..."
                placeholderTextColor={C.muted}
                multiline
                numberOfLines={3}
                value={reportNote}
                onChangeText={setReportNote}
              />
            </View>

          </ScrollView>

          {/* Submit */}
          <View style={s.detailFooter}>
            <TouchableOpacity
              style={[s.submitBtn, !actualWait && s.submitBtnDisabled]}
              onPress={submitReport}
              disabled={!actualWait}
            >
              <Text style={[s.submitBtnText, !actualWait && { color: C.muted }]}>
                Submit — Help the next dasher
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: C.sub,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: "uppercase",
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.safe,
  },
  cityText: {
    fontSize: 12,
    color: C.sub,
    fontWeight: "600",
  },

  // Stats strip
  statsStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  statNum: {
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 9,
    color: C.sub,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 8,
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 10,
  },

  // Filter pills
  pillsRow: {
    marginBottom: 10,
    flexGrow: 0,
  },
  pillsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.border,
    alignSelf: "flex-start",
  },
  pillActive: {
    backgroundColor: C.accent + "18",
    borderColor: C.accent + "66",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.sub,
  },
  pillTextActive: {
    color: C.accent,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Restaurant card
  rCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  rTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  rTopLeft: {
    flex: 1,
  },
  rName: {
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
  },
  rAddress: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  vBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  vBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Card stats
  rStats: {
    flexDirection: "row",
    gap: 8,
  },
  rStatBox: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  rStatNum: {
    fontSize: 16,
    fontWeight: "900",
  },
  rStatLabel: {
    fontSize: 9,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Lie bar
  lieBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  lieBarTitle: {
    fontSize: 10,
    color: C.sub,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  lieBarRight: {
    fontSize: 10,
    fontWeight: "700",
  },
  lieTrack: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  lieFill: {
    height: 6,
    borderRadius: 3,
  },

  // Card footer
  rFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rFooterLeft: {
    fontSize: 11,
    color: C.muted,
  },
  rFooterRight: {
    fontSize: 11,
    color: C.sub,
  },

  // Empty
  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: C.muted,
    textAlign: "center",
  },

  // Modal shell
  modalScreen: {
    flex: 1,
    backgroundColor: C.surface,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
    gap: 12,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
  },
  modalAddress: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 14,
    color: C.sub,
    fontWeight: "700",
  },
  modalScroll: {
    paddingBottom: 120,
    paddingTop: 6,
  },

  // Verdict banner
  verdictBanner: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  verdictBannerIcon: {
    fontSize: 28,
  },
  verdictBannerBody: {
    flex: 1,
  },
  verdictBannerLabel: {
    fontSize: 18,
    fontWeight: "900",
  },
  verdictBannerSub: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
  },

  // Detail stats
  detailStats: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  detailStatBox: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    gap: 3,
  },
  detailStatNum: {
    fontSize: 22,
    fontWeight: "900",
  },
  detailStatLabel: {
    fontSize: 9,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailStatSub: {
    fontSize: 10,
    color: C.sub,
    textAlign: "center",
  },

  // Detail sections
  detailCard: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 6,
  },
  lieAccurate: {
    fontSize: 11,
    color: C.sub,
    marginTop: 4,
  },

  // Unassign
  unassignRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  unassignCarIcon: {
    fontSize: 20,
  },
  unassignRate: {
    fontSize: 22,
    fontWeight: "900",
  },
  unassignLabel: {
    fontSize: 12,
    color: C.sub,
    flex: 1,
  },

  // Recent reports
  reportsHeader: {
    fontSize: 11,
    color: C.sub,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  repCard: {
    backgroundColor: C.bg,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  repBadges: {
    flexDirection: "row",
    gap: 6,
  },
  repBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  repBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  waitComp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  waitSaid: {
    fontSize: 13,
    color: C.sub,
    fontWeight: "600",
  },
  waitArrow: {
    fontSize: 13,
    color: C.muted,
  },
  waitActual: {
    fontSize: 13,
    fontWeight: "800",
  },
  waitShort: {
    fontSize: 12,
    fontWeight: "700",
  },
  repNote: {
    fontSize: 13,
    color: C.sub,
    fontStyle: "italic",
    lineHeight: 19,
  },
  repAgo: {
    fontSize: 11,
    color: C.muted,
  },

  // Detail footer
  detailFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  reportBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  reportBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#000",
  },

  // Report modal sections
  reportSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  reportSectionTitle: {
    fontSize: 11,
    color: C.sub,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  waitInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  waitInputCell: {
    flex: 1,
  },
  waitArrowBig: {
    fontSize: 20,
    color: C.muted,
    paddingBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    color: C.muted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  numInput: {
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "center",
  },
  lieDiffText: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 10,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    backgroundColor: C.bg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.sub,
  },
  noteInput: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontSize: 14,
    padding: 12,
    textAlignVertical: "top",
    minHeight: 80,
  },

  // Submit
  submitBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    backgroundColor: C.border,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#000",
  },
});
