import React, { useState } from "react";
import {
  ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from "react-native";
import { API_BASE_URL } from "../src/config";

type Snapshot = {
  symbol: string;
  company_name?: string | null;
  currency?: string | null;
  latest_available_close?: number | null;
  latest_bar_date?: string | null;
  week_52_high?: number | null;
  week_52_low?: number | null;
  pe_trailing?: number | null;
  pe_forward?: number | null;
  price_to_book?: number | null;
  eps_trailing?: number | null;
  roe_yahoo?: number | null;
  sector?: string | null;
  industry?: string | null;
  quote_type?: string;
  source?: string;
};

type Report = {
  verdict?: string;
  verdict_reason?: string;
  phases?: Record<string, any>;
  errors?: string[];
};

const fmt = (v: number | null | undefined, digits = 2) =>
  v == null || !Number.isFinite(v) ? "Unavailable" : v.toLocaleString("en-IN", { maximumFractionDigits: digits });

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>;
}

export default function Home() {
  const [company, setCompany] = useState("Infosys Limited");
  const [symbol, setSymbol] = useState("INFY.NS");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    setBusy(true); setError(""); setSnapshot(null); setReport(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/stocks/${encodeURIComponent(symbol.trim())}`);
      if (!response.ok) throw new Error(`Market data request failed (${response.status}). Check ticker and API URL.`);
      const data: Snapshot = await response.json();
      setSnapshot(data);

      const researchResponse = await fetch(`${API_BASE_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, symbol: symbol.trim() })
      });
      if (researchResponse.ok) setReport(await researchResponse.json());
    } catch (e: any) {
      setError(e?.message || "Could not fetch stock data.");
    } finally {
      setBusy(false);
    }
  }

  const price = snapshot?.latest_available_close;
  const currency = snapshot?.currency === "INR" ? "₹" : `${snapshot?.currency || ""} `;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>AI-POWERED EQUITY RESEARCH</Text>
            <Text style={styles.brand}>MarketLens <Text style={styles.accent}>AI</Text></Text>
          </View>
          <View style={styles.logo}><Text style={styles.logoText}>M</Text></View>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.label}>Company name</Text>
          <TextInput value={company} onChangeText={setCompany} style={styles.input} placeholder="Infosys Limited" placeholderTextColor="#73839A" />
          <Text style={styles.label}>Yahoo Finance ticker</Text>
          <TextInput value={symbol} onChangeText={setSymbol} autoCapitalize="characters" style={styles.input} placeholder="INFY.NS" placeholderTextColor="#73839A" />
          <Text style={styles.hint}>Indian NSE example: INFY.NS · BSE example: INFY.BO</Text>
          <TouchableOpacity style={styles.button} onPress={analyze} disabled={busy}>
            {busy ? <ActivityIndicator color="#06131A" /> : <Text style={styles.buttonText}>Analyze stock  →</Text>}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {snapshot ? <>
          <View style={styles.companyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{snapshot.company_name || company}</Text>
              <Text style={styles.muted}>{snapshot.symbol} · {snapshot.sector || "Sector unavailable"}</Text>
            </View>
            <View style={styles.pill}><Text style={styles.pillText}>DATA LOADED</Text></View>
          </View>
          <View style={styles.priceCard}>
            <Text style={styles.metricLabel}>LATEST AVAILABLE CLOSE</Text>
            <Text style={styles.price}>{currency}{fmt(price)}</Text>
            <Text style={styles.muted}>Daily bar date: {snapshot.latest_bar_date || "Unavailable"}</Text>
            <Text style={styles.warning}>Not guaranteed to be real-time market price.</Text>
          </View>
          <View style={styles.grid}>
            <Metric label="52W HIGH" value={`${currency}${fmt(snapshot.week_52_high)}`} />
            <Metric label="52W LOW" value={`${currency}${fmt(snapshot.week_52_low)}`} />
            <Metric label="TRAILING P/E" value={fmt(snapshot.pe_trailing)} />
            <Metric label="FORWARD P/E" value={fmt(snapshot.pe_forward)} />
            <Metric label="PRICE / BOOK" value={fmt(snapshot.price_to_book)} />
            <Metric label="EPS (TTM)" value={`${currency}${fmt(snapshot.eps_trailing)}`} />
            <Metric label="ROE (provider)" value={snapshot.roe_yahoo == null ? "Unavailable" : `${fmt(snapshot.roe_yahoo * 100)}%`} />
            <Metric label="INDUSTRY" value={snapshot.industry || "Unavailable"} />
          </View>
        </> : <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⌁</Text>
          <Text style={styles.emptyTitle}>Research your next stock</Text>
          <Text style={styles.muted}>Enter a company and ticker to load available market data and start the research workflow.</Text>
        </View>}

        {report ? <View style={styles.reportCard}>
          <Text style={styles.sectionTitle}>AI Research Summary</Text>
          <Text style={styles.verdict}>{report.verdict || "Report generated"}</Text>
          <Text style={styles.body}>{report.verdict_reason || "Review the phase details before drawing conclusions."}</Text>
          {Object.entries(report.phases || {}).map(([key, value]) => (
            <View key={key} style={styles.phase}>
              <Text style={styles.phaseTitle}>{key.replaceAll("_", " ").toUpperCase()}</Text>
              <Text style={styles.body}>Status: {value?.status || "Unknown"}</Text>
              {value?.note ? <Text style={styles.muted}>{value.note}</Text> : null}
            </View>
          ))}
        </View> : null}

        <View style={styles.reportCard}>
          <Text style={styles.sectionTitle}>Research framework</Text>
          {[
            ["01", "Integrity & Health", "Promoter holdings, pledges, debt, cash flow and regulatory disclosures"],
            ["02", "Growth & Efficiency", "Revenue and profit CAGR, ROE, ROIC and competitive moat"],
            ["03", "Valuation & Timing", "DCF, peer multiples, analyst targets and scenario outlook"]
          ].map(([n, title, detail]) => <View style={styles.frameworkRow} key={n}>
            <Text style={styles.number}>{n}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.phaseTitle}>{title}</Text>
              <Text style={styles.muted}>{detail}</Text>
            </View>
          </View>)}
        </View>
        <Text style={styles.disclaimer}>For research and education only; not investment advice. Missing data is not evidence of good or bad integrity. Verify all figures with official disclosures.</Text>
        <Text style={styles.footer}>MARKETLENS AI · VERSION 1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#080F1B" },
  page: { padding: 18, paddingBottom: 40, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 4 },
  eyebrow: { color: "#8FA3BC", fontSize: 10, letterSpacing: 1.8, fontWeight: "700" },
  brand: { color: "#F3F7FC", fontSize: 28, fontWeight: "800", marginTop: 5 },
  accent: { color: "#63E6BE" },
  logo: { width: 46, height: 46, borderRadius: 15, backgroundColor: "#173D38", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#63E6BE", fontSize: 23, fontWeight: "900" },
  searchCard: { backgroundColor: "#111C2C", borderColor: "#243248", borderWidth: 1, borderRadius: 20, padding: 15, gap: 8 },
  label: { color: "#C7D3E2", fontSize: 12, fontWeight: "700", marginTop: 3 },
  input: { color: "#F5F8FC", backgroundColor: "#0A1321", borderWidth: 1, borderColor: "#2A3B52", borderRadius: 11, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  hint: { color: "#8295AD", fontSize: 11 },
  button: { backgroundColor: "#63E6BE", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  buttonText: { color: "#06131A", fontSize: 15, fontWeight: "800" },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  companyName: { color: "#F5F8FC", fontSize: 20, fontWeight: "800" },
  muted: { color: "#8FA3BC", fontSize: 12, lineHeight: 18, marginTop: 3 },
  pill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#173D38" },
  pillText: { color: "#63E6BE", fontSize: 9, fontWeight: "800" },
  priceCard: { backgroundColor: "#111C2C", borderColor: "#26374E", borderWidth: 1, borderRadius: 18, padding: 18 },
  metricLabel: { color: "#8FA3BC", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  price: { color: "#F7FAFF", fontSize: 36, fontWeight: "800", marginTop: 6 },
  warning: { color: "#F5C779", fontSize: 11, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { width: "48%", flexGrow: 1, backgroundColor: "#111C2C", borderColor: "#26374E", borderWidth: 1, borderRadius: 15, padding: 14, minHeight: 82, justifyContent: "space-between" },
  metricValue: { color: "#F5F8FC", fontSize: 17, fontWeight: "800", marginTop: 10 },
  empty: { backgroundColor: "#111C2C", borderRadius: 20, padding: 28, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#243248" },
  emptyIcon: { color: "#63E6BE", fontSize: 42 },
  emptyTitle: { color: "#F5F8FC", fontSize: 18, fontWeight: "800" },
  reportCard: { backgroundColor: "#111C2C", borderColor: "#26374E", borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  sectionTitle: { color: "#F5F8FC", fontSize: 18, fontWeight: "800" },
  verdict: { color: "#F5C779", fontSize: 14, fontWeight: "800" },
  body: { color: "#C0CDDC", fontSize: 12, lineHeight: 19 },
  phase: { borderTopWidth: 1, borderTopColor: "#29384D", paddingTop: 10, gap: 3 },
  phaseTitle: { color: "#EAF0F8", fontSize: 12, fontWeight: "800" },
  frameworkRow: { flexDirection: "row", gap: 12, paddingVertical: 7 },
  number: { color: "#63E6BE", fontWeight: "900", fontSize: 13 },
  disclaimer: { color: "#8295AD", fontSize: 11, lineHeight: 17, textAlign: "center", paddingHorizontal: 8 },
  footer: { color: "#52657D", fontSize: 9, textAlign: "center", letterSpacing: 2, marginTop: 3 }
});
