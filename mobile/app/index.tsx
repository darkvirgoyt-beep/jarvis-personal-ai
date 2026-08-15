import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import * as WebBrowser from "expo-web-browser";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { approvedMobileActionUrl, createMobileActionProposal, type MobileActionKind, type MobileActionProposal } from "../../shared/jarvisMobileIntents";
import { clearMobileSession, createMobilePairingRequest, exchangeMobilePairingCode, loadMobileSession, saveMobileSession, streamJarvisMobileResponse } from "@/src/lib/mobile-api";

const actions: Array<{ kind: MobileActionKind; label: string }> = [
  { kind: "search", label: "Search" },
  { kind: "maps", label: "Map" },
  { kind: "directions", label: "Directions" },
  { kind: "call", label: "Call" },
  { kind: "sms", label: "SMS" },
  { kind: "whatsapp", label: "WhatsApp" },
  { kind: "instagram", label: "Instagram" },
];

export default function JarvisCompanion() {
  const [session, setSession] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [working, setWorking] = useState(false);
  const [listening, setListening] = useState(false);
  const [actionInput, setActionInput] = useState("");
  const [proposal, setProposal] = useState<MobileActionProposal | null>(null);

  useEffect(() => {
    loadMobileSession().then(setSession);
  }, []);

  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", event => setPrompt(event.results[0]?.transcript ?? ""));
  useSpeechRecognitionEvent("error", event => {
    setListening(false);
    Alert.alert("Voice unavailable", event.message || "Type your request instead.");
  });

  async function connect() {
    const pairing = await createMobilePairingRequest();
    const result = await WebBrowser.openAuthSessionAsync(pairing.url, "jarvis://auth");
    if (result.type !== "success") return;
    const code = Linking.parse(result.url).queryParams?.code;
    if (typeof code !== "string") {
      Alert.alert("Connection not completed", "No pairing code was returned. Sign in to Jarvis in the opened browser, then try again.");
      return;
    }
    const token = await exchangeMobilePairingCode(code, pairing.verifier);
    await saveMobileSession(token);
    setSession(token);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function toggleVoice() {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Microphone permission", "Jarvis uses the microphone only while you press the voice control. You can still type a request.");
      return;
    }
    ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: false });
  }

  async function send() {
    if (!prompt.trim()) return;
    if (!session) {
      Alert.alert("Connect Jarvis", "Connect your private Jarvis session before sending requests.");
      return;
    }
    setResponse("");
    setWorking(true);
    let completedResponse = "";
    try {
      await streamJarvisMobileResponse({
        token: session,
        content: prompt,
        onDelta: delta => {
          completedResponse += delta;
          setResponse(completedResponse);
        },
      });
      Speech.speak(completedResponse || "Jarvis has finished responding.", { rate: 0.95, pitch: 1.08 });
    } catch (error) {
      Alert.alert("Jarvis unavailable", error instanceof Error ? error.message : "Try again shortly.");
    } finally {
      setWorking(false);
    }
  }

  function proposeAction(kind: MobileActionKind) {
    try {
      setProposal(createMobileActionProposal(kind, actionInput));
    } catch (error) {
      Alert.alert("Action needs details", error instanceof Error ? error.message : "Enter an action target first.");
    }
  }

  async function useLocationForMap() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Location permission", "Jarvis requests location only for this map handoff. You can enter a destination instead.");
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    setProposal(createMobileActionProposal("maps", `${position.coords.latitude},${position.coords.longitude}`));
  }

  async function approveAction() {
    if (!proposal) return;
    await Linking.openURL(approvedMobileActionUrl(proposal, true));
    setProposal(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>JARVIS // ANDROID COMPANION</Text>
          <Text style={styles.title}>Your private command surface.</Text>
          <Text style={styles.caption}>Voice, reply, then a confirmed handoff to Android.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>PRIVATE SESSION</Text>
          <Text style={styles.status}>{session ? "Connected to your Jarvis account" : "Not connected"}</Text>
          <Pressable style={styles.primary} onPress={session ? async () => { await clearMobileSession(); setSession(null); } : connect}>
            <Text style={styles.primaryText}>{session ? "Disconnect this phone" : "Connect Jarvis"}</Text>
          </Pressable>
          <Text style={styles.note}>Connection opens the existing Jarvis browser sign-in. A short-lived session stays in this device’s secure storage.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>COMMAND</Text>
          <TextInput value={prompt} onChangeText={setPrompt} placeholder="Ask Jarvis anything" placeholderTextColor="#62718d" multiline style={styles.input} />
          <View style={styles.row}>
            <Pressable style={[styles.secondary, listening && styles.active]} onPress={toggleVoice}><Text style={styles.buttonText}>{listening ? "Stop listening" : "Push to talk"}</Text></Pressable>
            <Pressable style={styles.primary} onPress={send}><Text style={styles.primaryText}>{working ? "Thinking…" : "Send"}</Text></Pressable>
          </View>
          {working && <ActivityIndicator color="#6de7ff" style={styles.spinner} />}
          {!!response && <Text style={styles.response}>{response}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>CONFIRMED ANDROID HANDOFFS</Text>
          <TextInput value={actionInput} onChangeText={setActionInput} placeholder="Destination, search, username, or number" placeholderTextColor="#62718d" style={styles.input} />
          <View style={styles.actionGrid}>{actions.map(action => <Pressable key={action.kind} style={styles.action} onPress={() => proposeAction(action.kind)}><Text style={styles.buttonText}>{action.label}</Text></Pressable>)}</View>
          <Pressable style={styles.location} onPress={useLocationForMap}><Text style={styles.buttonText}>Use location for map</Text></Pressable>
          <Text style={styles.note}>Jarvis never calls, messages, navigates, or opens another app until you review and approve the target below.</Text>
        </View>
      </ScrollView>

      {proposal && <View style={styles.sheet}><Text style={styles.section}>APPROVE HANDOFF?</Text><Text style={styles.proposal}>{proposal.label}: {proposal.url}</Text><View style={styles.row}><Pressable style={styles.secondary} onPress={() => setProposal(null)}><Text style={styles.buttonText}>Cancel</Text></Pressable><Pressable style={styles.primary} onPress={approveAction}><Text style={styles.primaryText}>Open Android app</Text></Pressable></View></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#070b14" }, page: { padding: 20, gap: 16, paddingBottom: 48 }, header: { paddingTop: 16, gap: 6 }, eyebrow: { color: "#ff75d1", letterSpacing: 2, fontSize: 11, fontWeight: "700" }, title: { color: "#edf9ff", fontSize: 28, lineHeight: 34, fontWeight: "700" }, caption: { color: "#9aaeca", fontSize: 14, lineHeight: 20 }, card: { backgroundColor: "#0d1526", borderColor: "#233653", borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 }, section: { color: "#6de7ff", fontSize: 11, letterSpacing: 1.4, fontWeight: "700" }, status: { color: "#e5f0ff", fontSize: 15 }, note: { color: "#8292af", fontSize: 12, lineHeight: 17 }, input: { minHeight: 48, borderRadius: 11, borderColor: "#294464", borderWidth: 1, color: "#effaff", padding: 12, fontSize: 15, backgroundColor: "#090f1d" }, row: { flexDirection: "row", gap: 10 }, primary: { flex: 1, minHeight: 46, borderRadius: 11, justifyContent: "center", alignItems: "center", backgroundColor: "#6de7ff" }, secondary: { flex: 1, minHeight: 46, borderRadius: 11, justifyContent: "center", alignItems: "center", backgroundColor: "#17243b", borderColor: "#314e75", borderWidth: 1 }, active: { backgroundColor: "#5e2c70", borderColor: "#ff75d1" }, primaryText: { color: "#07101c", fontWeight: "800", fontSize: 14 }, buttonText: { color: "#d8ecff", fontWeight: "700", fontSize: 13 }, spinner: { marginTop: 6 }, response: { color: "#d8ecff", fontSize: 15, lineHeight: 22, borderTopColor: "#203551", borderTopWidth: 1, paddingTop: 12 }, actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, action: { minHeight: 39, paddingHorizontal: 12, justifyContent: "center", alignItems: "center", borderRadius: 9, borderColor: "#2c4b6f", borderWidth: 1, backgroundColor: "#101d31" }, location: { minHeight: 42, justifyContent: "center", alignItems: "center", borderRadius: 9, borderColor: "#b25199", borderWidth: 1, backgroundColor: "#23152c" }, sheet: { position: "absolute", left: 14, right: 14, bottom: 14, backgroundColor: "#121d31", borderColor: "#ff75d1", borderWidth: 1, borderRadius: 16, padding: 16, gap: 12, shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 20, elevation: 8 }, proposal: { color: "#e4efff", fontSize: 13, lineHeight: 19 },
});
