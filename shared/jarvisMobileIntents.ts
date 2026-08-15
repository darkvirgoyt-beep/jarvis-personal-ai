export type MobileActionKind =
  | "search"
  | "maps"
  | "directions"
  | "call"
  | "sms"
  | "whatsapp"
  | "instagram";

export type MobileActionProposal = {
  kind: MobileActionKind;
  label: string;
  url: string;
  requiresApproval: true;
};

const cleanPhone = (value: string) => value.replace(/[^+\d]/g, "");
const encode = (value: string) => encodeURIComponent(value.trim());

export function createMobileActionProposal(
  kind: MobileActionKind,
  input: string
): MobileActionProposal {
  const text = input.trim();
  if (!text) throw new Error("Enter a destination or recipient first.");

  const urls: Record<MobileActionKind, string> = {
    search: `https://www.google.com/search?q=${encode(text)}`,
    maps: `https://www.google.com/maps/search/?api=1&query=${encode(text)}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${encode(text)}`,
    call: `tel:${cleanPhone(text)}`,
    sms: `sms:${cleanPhone(text)}`,
    whatsapp: `https://wa.me/${cleanPhone(text).replace(/^\+/, "")}`,
    instagram: `https://www.instagram.com/${encode(text.replace(/^@/, ""))}/`,
  };

  if (["call", "sms", "whatsapp"].includes(kind) && cleanPhone(text).length < 4) {
    throw new Error("Enter a valid phone number.");
  }

  return {
    kind,
    label: kind === "maps" ? "Open map" : `Open ${kind}`,
    url: urls[kind],
    requiresApproval: true,
  };
}

export function approvedMobileActionUrl(proposal: MobileActionProposal, approved: boolean): string {
  if (!approved) throw new Error("External Android handoffs require explicit approval.");
  return proposal.url;
}
