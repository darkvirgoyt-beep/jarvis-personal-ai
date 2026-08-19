# Activating Google and GitHub Sign-In for Jarvis

Jarvis already renders Google and GitHub sign-in choices and returns to the approved production callback path. Activating either provider is an **owner-only dashboard action** because the OAuth client secret must stay in the provider dashboard and Supabase configuration; never paste it into source code, a browser console, a chat, or a GitHub issue.

| Item | Production value |
| --- | --- |
| Jarvis production site | `https://scrimly-seven.vercel.app` |
| Jarvis OAuth completion return | `https://scrimly-seven.vercel.app/?auth=complete` |
| Supabase project callback | `https://ytqacgefcvjrahyyfmaw.supabase.co/auth/v1/callback` |
| Supabase provider settings | `https://supabase.com/dashboard/project/ytqacgefcvjrahyyfmaw/auth/providers` |

## Google

Create a **Web application** OAuth client in Google Cloud Console. Add the production site URL as an authorized JavaScript origin and add the exact Supabase project callback URL above as an authorized redirect URI. In Supabase, open **Authentication → Providers → Google**, enable the provider, and enter the Google client ID and client secret there. Finally, ensure the Jarvis completion return URL is listed in **Authentication → URL Configuration → Redirect URLs**.

## GitHub

Create a GitHub OAuth App for the Jarvis production site. Set the application homepage URL to the Vercel production URL and set the authorization callback URL to the exact Supabase project callback URL above. In Supabase, open **Authentication → Providers → GitHub**, enable the provider, and enter the OAuth App client ID and client secret there. Confirm that the Jarvis completion return URL remains in Supabase’s redirect allow-list.

## Verify safely

Open the public Jarvis sign-in dialog in a private browser session, choose one provider, and complete a test login with an account controlled by the owner. A successful callback returns to Jarvis at `/?auth=complete`, after which the browser removes callback tokens from the visible URL. Do not use production user accounts that do not belong to the owner for this check.

> Provider activation allows authentication only. It does not grant Jarvis access to Google Drive, Gmail, GitHub repositories, or other provider data. Any future data integration requires a separate, explicit OAuth scope review and approval.

## References

1. [Supabase Google social login guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
2. [Supabase GitHub social login guide](https://supabase.com/docs/guides/auth/social-login/auth-github)
3. [Supabase OAuth sign-in reference](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)
