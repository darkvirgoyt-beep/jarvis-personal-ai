export type JarvisExternalActionKind = "search" | "maps" | "directions" | "call" | "sms" | "whatsapp" | "instagram";

export type JarvisLocationContext = { latitude: number; longitude: number; accuracy?: number };

export type JarvisExternalAction = {
  kind: JarvisExternalActionKind;
  label: string;
  destination: string;
  url: string;
  riskLevel: "low" | "medium";
};

export const JARVIS_EXTERNAL_ACTION_OPTIONS: Array<{ value: JarvisExternalActionKind; label: string; placeholder: string }> = [
  { value: "search", label: "Search the web", placeholder: "What should Jarvis search for?" },
  { value: "maps", label: "Find a place on maps", placeholder: "Coffee shops, a place, or an address" },
  { value: "directions", label: "Open directions", placeholder: "Destination or address" },
  { value: "call", label: "Prepare a call", placeholder: "Phone number with country code" },
  { value: "sms", label: "Prepare a text message", placeholder: "Phone number; add message after |" },
  { value: "whatsapp", label: "Open WhatsApp chat", placeholder: "Phone number; add draft message after |" },
  { value: "instagram", label: "Open Instagram profile", placeholder: "Instagram username" },
];

function required(value: string, message: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(message);
  return trimmed;
}

function phone(value: string) {
  const normalized = value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) throw new Error("Enter a valid phone number including its country code.");
  return normalized.startsWith("+") ? `+${digits}` : `+${digits}`;
}

function splitRecipientAndBody(value: string) {
  const [recipient, ...body] = required(value, "Enter a phone number.").split("|");
  return { recipient: phone(recipient), body: body.join("|").trim() };
}

function instagramHandle(value: string) {
  const handle = required(value, "Enter an Instagram username.").replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) throw new Error("Enter a valid Instagram username without a link.");
  return handle;
}

export function buildJarvisExternalAction(kind: JarvisExternalActionKind, rawDestination: string, location?: JarvisLocationContext): JarvisExternalAction {
  if (kind === "search") {
    const destination = required(rawDestination, "Enter a search query.");
    return { kind, label: "Web search", destination, url: `https://www.google.com/search?q=${encodeURIComponent(destination)}`, riskLevel: "low" };
  }

  if (kind === "maps" || kind === "directions") {
    const destination = required(rawDestination, "Enter a destination or place.");
    const base = kind === "maps" ? "https://www.google.com/maps/search/?api=1&query=" : "https://www.google.com/maps/dir/?api=1&destination=";
    const locationContext = location ? ` from current location (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})` : "";
    return { kind, label: kind === "maps" ? "Map search" : "Directions", destination, url: `${base}${encodeURIComponent(destination)}`, riskLevel: "low" };
  }

  if (kind === "call") {
    const destination = phone(required(rawDestination, "Enter a phone number."));
    return { kind, label: "Phone handoff", destination, url: `tel:${destination}`, riskLevel: "medium" };
  }

  if (kind === "sms" || kind === "whatsapp") {
    const { recipient, body } = splitRecipientAndBody(rawDestination);
    const message = body ? ` with draft “${body}”` : "";
    const url = kind === "sms"
      ? `sms:${recipient}${body ? `?body=${encodeURIComponent(body)}` : ""}`
      : `https://wa.me/${recipient.replace(/\D/g, "")}${body ? `?text=${encodeURIComponent(body)}` : ""}`;
    return { kind, label: kind === "sms" ? "SMS handoff" : "WhatsApp handoff", destination: `${recipient}${message}`, url, riskLevel: "medium" };
  }

  const destination = instagramHandle(rawDestination);
  return { kind, label: "Instagram profile", destination: `@${destination}`, url: `https://www.instagram.com/${encodeURIComponent(destination)}/`, riskLevel: "low" };
}
