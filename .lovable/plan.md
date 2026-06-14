## 1. Chat upgrades (voice notes, images, emoji)

**Storage**: new private bucket `chat-media` with RLS so only sender/receiver of a message can read its files.

**DB**: extend `messages` with:
- `attachment_url text` (storage path)
- `attachment_type text` ('image' | 'audio')
- `attachment_duration_ms int` (for voice)

**Chat page (`chat.$listingId.$otherId.tsx`)**:
- **Emoji**: add a smiley button that opens a lightweight emoji picker (use `emoji-picker-react`) and inserts into the text input.
- **Image attach**: paperclip button → file input (image/*). Upload to `chat-media/{listingId}/{uuid}.jpg`, insert message with `attachment_type='image'`. Render inline thumbnail (signed URL) that opens full-size.
- **Voice note**: mic button → press to record (MediaRecorder, webm/opus). Show recording timer + cancel. On stop, upload + send message with `attachment_type='audio'` and duration. Render with `<audio controls>` and duration label.
- All bubbles support optional caption (text + attachment together).

## 2. Dark / Light mode

- Add a `ThemeProvider` (`src/lib/theme.tsx`) — reads `localStorage.theme` (default `system`), toggles `dark` class on `<html>`, follows OS when set to system.
- Mount provider in `__root.tsx`.
- Add a sun/moon toggle in `Navbar.tsx` (and inside profile dropdown for mobile).
- Verify `src/styles.css` has `.dark` token block; if missing/incomplete, fill semantic tokens so all pages flip correctly (the project already uses semantic tokens so most UI auto-adapts).

## 3. WhatsApp admin alerts (+233 24 520 9130)

Use the existing **Twilio** connector path (per system instructions, WhatsApp via Twilio).

**Plan**:
- Connect Twilio standard connector (`standard_connectors--connect twilio`) — user enters Twilio API key + WhatsApp From number in the connector form.
- New server fn `notifyAdminWhatsapp(message)` in `src/lib/admin-notify.functions.ts` — POSTs to `https://connector-gateway.lovable.dev/twilio/Messages.json` with `From=whatsapp:<TWILIO_WA_FROM>`, `To=whatsapp:+233245209130`, `Body=<message>`.
- Call it from:
  - `submit-listing.tsx` after successful insert (status `pending`) → "📋 New listing pending review: {title} by {seller}. {adminUrl}"
  - `ReviewsSection.tsx` after a review insert → "⭐ New review ({rating}★) on {dealer} — {adminUrl}" (admin reviews list)
- Fire-and-forget (errors don't block the user flow); log on the server.
- Admin number is hardcoded in the server fn (per user choice).

**Note**: I'll trigger the Twilio connection flow first; the user must approve it before the alerts can actually send. Code will gracefully no-op if `TWILIO_API_KEY` is missing.

## Files

- migration: chat-media bucket policies + `messages` columns + grants
- new: `src/lib/theme.tsx`, `src/lib/admin-notify.functions.ts`, `src/components/EmojiButton.tsx`, `src/components/VoiceRecorder.tsx`
- edit: `src/routes/__root.tsx`, `src/components/Navbar.tsx`, `src/routes/_authenticated/chat.$listingId.$otherId.tsx`, `src/routes/_authenticated/submit-listing.tsx`, `src/components/ReviewsSection.tsx`, `src/integrations/supabase/types.ts` (regen)
- deps: `emoji-picker-react`