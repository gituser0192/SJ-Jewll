# Sheochand Jewellery

A React App Router storefront, hosted with a Cloudflare-compatible Vinext build and D1 SQLite database. Ponytail approach: one storefront, one API router, native date inputs, CSS motion, existing UI primitives, and direct service APIs. No separate Express server, animation framework or ORM query layer.

## Run

Use Node 22.13+ and `npm run install:ci`, then `npm run build`. Generate migrations with `npm run db:generate` after schema changes. For local D1 apply the two SQL files in `drizzle/` in order using Wrangler's `d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file <migration>` command. `npm run dev` starts the preview. `node scripts/check.mjs` runs the API smoke check against the local URL (override with `SJ_BASE_URL`). The check uses fabricated local-only contacts and never sends real SMS or payments.

## Admin portal

Visit /admin and sign in with the authorised ChatGPT account, hs2162943@gmail.com. The hosted ADMIN_EMAIL secret restricts every management API request to this account. The old shared admin key is no longer used. Local-only preview uses the starter's seedy@sites.test mock identity; it never applies to production.

Use Collection to add a piece, upload/replace/remove its photograph, edit the name and description below it, set material and price labels, and save as draft or publish. Remove piece asks for confirmation. Drafts and removed pieces are excluded from the storefront. Uploaded images are retained in R2 after removing a catalogue entry, avoiding deletion of files that may be reused. A storage-cleanup workflow is not included.

Use Consultations for enquiries and status updates. Use Gold & silver rates to enter verified figures. Account changes require changing the hosted ADMIN_EMAIL secret and republishing.

## Live service configuration

`.env.example` lists required names; credentials stay server-side. Set hosted secrets through Sites, then republish.

- OpenAI: set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. The server calls the Responses API. Until connected, the widget identifies itself as a prepared guide, not AI. No training or fine-tuning is claimed.
- SMS: set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`. Consultations are saved before an optional SMS attempt. Submission is not phone verification. No OTP flow is implemented because the site has no requested account sign-up flow. Obtain an appropriate sender/service configuration before enabling SMS.
- Payments: set `STRIPE_SECRET_KEY`, `DEPOSIT_INR` (integer INR), and `STRIPE_WEBHOOK_SECRET`. Register `/api/stripe-webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Paid state only changes after an HMAC-verified webhook with matching INR amount; browser return URLs never mark a booking paid. Test with Stripe test credentials before live use. Appointment confirmation remains a separate shop action.
- WhatsApp links open a prefilled draft to +91 70276 53802. Visitors send the message themselves. This is click-to-chat, not an automatic WhatsApp Business message service.

## Intentional limits

- Photos are supplied by the user; six distinct images are copied locally. Product names and categories are illustrative. Hallmarks, actual material, prices, stock and addresses are not invented. The requested SJ crest and Royal Polki bridal photo were not supplied.
- The camera now renders photographic transparent PNG cutouts with smoothed position/scale/roll, turn-dependent earring visibility and scene-brightness adjustment. The initial gemstone earring and pearl necklace cutouts were AI-prepared from the supplied photographs; they are illustrative reconstructions rather than exact scans. Admins can upload product-accurate PNG cutouts and calibrate their size and placement. A flat image is not a 3D model and will not perfectly handle side views, hair occlusion or neck movement. Live fitting needs a real-device check. The camera has local fit controls and a private, downloadable snapshot; video and snapshots are not uploaded.
- `SJ-2036-POLKI-8842` is a sample pedigree record with SHA-256 fingerprinting, not a real blockchain or holographic scan. Artisan/signature/alloy data is explicitly simulated.
- Wishlist persists in D1, keyed by an HttpOnly visitor cookie. It survives reloads on the same browser, not across devices. Consultation leads are durable; the admin key controls CRM access.
- AI, SMS and payments have adapters but are not live-tested without merchant credentials. This is a reviewable first application, not a certified production commerce system. Set the real catalogue, privacy/retention policy, verified shop rates, merchant terms and service credentials before opening to customers.
- WebMCP exposes catalogue filtering when the browser supports it.

## Implementation references

[MediaPipe web face tracking](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js), [Stripe signature verification](https://docs.stripe.com/webhooks/signature), [Twilio message resource](https://www.twilio.com/docs/messaging/api/message-resource), [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create).

## Local preview error recovery

`server.forwardConsole: false` prevents Vite 8.0.13's disconnected console-forwarding handler from generating repeated `send was called before connect` promise rejections. Runtime errors remain visible in browser DevTools and hot reloading remains enabled. Run `node scripts/check-dev.mjs` against the running local preview to verify the resolved Vite client configuration. Restart `npm run dev` and reload any tab that still contains the old Vite client after configuration changes. Camera inference failures now stop the stream and show a restart message.

The current palette follows the supplied client-work screenshots: white, soft rose (#fff6f8), champagne gold (#b89e4c), rose enquiry accents (#c92759) and charcoal (#1a1a1a). The original reference folder is unchanged.

[Vite console-forwarding disconnect issue](https://github.com/vitejs/vite/issues/22407) · [Vite forwarding configuration](https://v8.vite.dev/config/server-options#server-forwardconsole)

## Admin and camera checks

Run `node scripts/check-admin.mjs` against the local preview for account authorisation, forged-header rejection, create/edit/remove, draft visibility, rendered account gate, R2 photo upload/read, unsafe image rejection, CSRF and photographic pose/rendering checks. It creates and removes a fabricated local piece and retains its uploaded test file locally. No production contacts, SMS or payments are used. Browser inspection was unavailable during this update because the computer-use tool could not verify the current Windows browser URL. Live camera alignment and user-interface visual QA are therefore unverified.

Initial cutout assets: `public/tryon/botanical-drop.png` and `public/tryon/pearl-necklace.png`, created with the built-in ImageGen tool. Prompts: extract one photographed blue gemstone drop earring vertically on transparent alpha; isolate the pearl necklace as a front-facing open U-shaped strand on transparent alpha. Both preserve the supplied photographs as design references.

## Customer sign-in and live try-on

The customer login page is `/login`. The storefront can be browsed without signing in. `/try-on` checks the platform identity on the server and redirects guests to `/login?next=%2Ftry-on`. The branded login page uses the existing top-level ChatGPT sign-in service and returns the customer to the protected camera studio. Anyone with an authenticated customer account can use the studio; this never grants admin permissions. `/api/session` rechecks identity before camera access and uses private, no-store caching. Sign-in and sign-out remain platform-owned; Sheochand stores no customer passwords. Local preview still uses the starter's mock identity, while the hosted site uses real ChatGPT accounts.

Run `node scripts/check-login.mjs` against localhost to test the guest redirect, login page, return-path validation, session checks, authenticated studio, cache isolation, forged-header denial and logout. The separate admin and catalogue checks remain applicable. Use an incognito browser window to see the logged-out login screen if your normal browser is already signed in. The live catalogue audience is public so customers can reach this flow; admin APIs still require the configured owner email.
