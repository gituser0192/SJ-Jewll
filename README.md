# Sheochand Jewellery

A React App Router storefront, hosted with a Cloudflare-compatible Vinext build and D1 SQLite database. Ponytail approach: one storefront, one API router, native date inputs, CSS motion, existing UI primitives, and direct service APIs. No separate Express server, animation framework or ORM query layer.

## Run

Use Node 22.13+ and `npm run install:ci`, then `npm run build`. Generate migrations with `npm run db:generate` after schema changes. For local D1 apply the two SQL files in `drizzle/` in order using Wrangler's `d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file <migration>` command. `npm run dev` starts the preview. `node scripts/check.mjs` runs the API smoke check against the local URL (override with `SJ_BASE_URL`). The check uses fabricated local-only contacts and never sends real SMS or payments.

## Admin

Visit `/admin`. Your generated private admin key is in the ignored local `.env` file under `ADMIN_TOKEN`; never share or commit it. The deployed secret is configured separately in Sites. The desk edits verified rates, product JSON and lead status. No verified rates are seeded. The ticker updates every minute, labels the supplied date, and warns when older than a day.

## Live service configuration

`.env.example` lists required names; credentials stay server-side. Set hosted secrets through Sites, then republish.

- OpenAI: set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. The server calls the Responses API. Until connected, the widget identifies itself as a prepared guide, not AI. No training or fine-tuning is claimed.
- SMS: set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`. Consultations are saved before an optional SMS attempt. Submission is not phone verification. No OTP flow is implemented because the site has no requested account sign-up flow. Obtain an appropriate sender/service configuration before enabling SMS.
- Payments: set `STRIPE_SECRET_KEY`, `DEPOSIT_INR` (integer INR), and `STRIPE_WEBHOOK_SECRET`. Register `/api/stripe-webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Paid state only changes after an HMAC-verified webhook with matching INR amount; browser return URLs never mark a booking paid. Test with Stripe test credentials before live use. Appointment confirmation remains a separate shop action.
- WhatsApp links open a prefilled draft to +91 70276 53802. Visitors send the message themselves. This is click-to-chat, not an automatic WhatsApp Business message service.

## Intentional limits

- Photos are supplied by the user; six distinct images are copied locally. Product names and categories are illustrative. Hallmarks, actual material, prices, stock and addresses are not invented. The requested SJ crest and Royal Polki bridal photo were not supplied.
- The camera tracks facial landmarks locally using MediaPipe. It renders approximate necklace and earring silhouettes rather than exact photographed products or physically accurate 3D models. Ring try-on is excluded from a face tracker. Camera/device performance and alignment require a real-device check. External model and WASM loading requires an internet connection.
- `SJ-2036-POLKI-8842` is a sample pedigree record with SHA-256 fingerprinting, not a real blockchain or holographic scan. Artisan/signature/alloy data is explicitly simulated.
- Wishlist persists in D1, keyed by an HttpOnly visitor cookie. It survives reloads on the same browser, not across devices. Consultation leads are durable; the admin key controls CRM access.
- AI, SMS and payments have adapters but are not live-tested without merchant credentials. This is a reviewable first application, not a certified production commerce system. Set the real catalogue, privacy/retention policy, verified shop rates, merchant terms and service credentials before opening to customers.
- WebMCP exposes catalogue filtering when the browser supports it.

## Implementation references

[MediaPipe web face tracking](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js), [Stripe signature verification](https://docs.stripe.com/webhooks/signature), [Twilio message resource](https://www.twilio.com/docs/messaging/api/message-resource), [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create).
