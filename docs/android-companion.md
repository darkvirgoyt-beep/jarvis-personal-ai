# Jarvis Android Companion

## Delivery status

The repository now contains a separately installable Expo/React Native companion under [`mobile/`](../mobile/). It provides an Android-first command surface with typed input, visible push-to-talk, streamed Jarvis replies, local text-to-speech, a short-lived private session bridge, transient location-to-map proposals, and confirmation-gated handoffs. This is **source and release-handoff readiness**, not a signed APK or Play Store listing.

| Area | Included in the companion source | Deliberate boundary |
|---|---|---|
| Private connection | Browser sign-in opens the existing Jarvis service, then exchanges a one-time verifier-bound pairing code for a short-lived phone session stored in Android secure storage. | No provider key, database password, JWT secret, GitHub credential, or long-lived bearer appears in app source, a deep link, or a repository. |
| Voice command | A visible push-to-talk control asks for microphone/speech-recognition permission at the time of use and retains typed input as a fallback. | No hidden listening, automatic microphone activation, or background wake-word capture is enabled. |
| Replies | The companion is prepared to consume the authenticated streaming endpoint and to speak the completed reply using local device TTS. | Speech voice availability and quality remain controlled by the installed Android voice services. |
| Location and maps | A **Use location for map** control requests foreground location only for that action and produces a reviewable map destination. | No continuous tracking or location persistence is implemented. |
| Phone/app handoffs | Search, map, directions, calls, SMS, WhatsApp, and Instagram are constructed as visible proposals and open only after an explicit approval. | Jarvis does not dial, send, publish, read other apps, unlock the phone, or bypass the destination app’s confirmation and permission controls. |

> **Safety invariant:** Jarvis may prepare an Android destination, but the user must approve it in the companion before the operating system is asked to open the relevant app or link.

## Secure phone pairing

The companion creates a fresh local verifier and SHA-256 challenge before opening the existing Jarvis browser sign-in. The server accepts only the fixed `jarvis://auth` callback, saves a hash of a five-minute opaque code and the verifier challenge in `jarvisMobilePairings`, and returns only the opaque code in the custom URI. The companion must then prove possession of its original verifier at `/api/jarvis/mobile/token` before the server creates the 24-hour bearer session. The database marks the code as exchanged atomically, preventing reuse across autoscaled service instances.

This arrangement avoids exposing a bearer credential through a custom URI and keeps the mobile session in `expo-secure-store`, which uses device-protected storage. The companion is intentionally not an unattended device-control agent.

## Phone-first release handoff

The owner does **not** need a local Windows, macOS, Linux, or Termux build environment to use the source foundation. A subsequent release owner with an Expo account can connect this `mobile/` directory to a managed build service, supply the Android application identifier and signing credentials in that service, install a testing build, and later submit an explicitly reviewed production build. Those account, signing, and store steps are ownership actions and cannot be safely performed or claimed silently by Jarvis.

The isolated mobile package has its own `package.json`, `app.json`, and TypeScript configuration. Its `typecheck` script has been validated in this repository. The companion requires a development build because the native speech-recognition package uses an Expo config plugin rather than the standard sandbox client. [2]

## Native capability references

Expo’s permission model requires an app to declare permissions and request them at runtime; the companion follows this model for foreground location and microphone/speech use. [1] The included speech-recognition module uses Android’s speech recognizer through a visible start/stop flow after permission approval. [2] Android implicit intents are appropriate for handing a reviewed map, dial, messaging, or web destination to the operating system or a compatible app. [3]

## References

[1] [Expo Documentation — Permissions](https://docs.expo.dev/guides/permissions/)

[2] [expo-speech-recognition — Installation, permissions, and usage](https://github.com/jamsch/expo-speech-recognition)

[3] [Android Developers — Common intents](https://developer.android.com/guide/components/intents-common)
