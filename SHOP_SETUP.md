# Managing Sheochand Jewellery

Open `/admin` and sign in with the owner account. The hosted owner is configured by the `ADMIN_EMAIL` secret. Local preview uses the Sites mock account, `seedy@sites.test`; that mock sign-in is not a production login.

## Website content

Use **Website content** to change the homepage banner, photographs, brand, search title, collection names, contact details and policies. Upload images or reuse a catalogue image path. Save changes, then reload the storefront. Move products before removing a collection that contains them.

## Enable ordering for a piece

In **Collection**, edit a piece and enter its verified final price in rupees and stock on hand. Publish it. A zero price leaves the piece available for enquiry only. Stock on hand includes quantities reserved for orders; it cannot be reduced below those reservations.

Customers sign in, add pieces to their account bag, and submit an order request. They can see receipts and status under `/orders`. Delivery is optional; enable it and set a flat charge under **Website content → Orders & delivery**. Enter real shipping, return and privacy policies before taking orders.

## Process an order

1. Open **Customer orders** and confirm a pending request after checking its details.
2. Arrange payment directly with the customer. Record payment received only after verifying the full amount outside this website.
3. Mark the order fulfilled when it is dispatched or collected. Add a dispatch reference or pickup note if needed.

Pending requests reserve stock for 24 hours. Expired or cancelled requests release it. Confirmed orders stay reserved until fulfilled or cancelled; fulfilment deducts stock once. A customer can cancel only a pending unpaid request. Paid orders cannot be cancelled in the portal; handle any refund directly with the customer.

Checkout currently accepts **unpaid order requests**. It does not collect card payments, issue tax invoices, calculate taxes or send order emails. Prices entered in admin are the final customer amounts; only the configured delivery charge is added. The existing consultation-deposit adapter is separate from store orders.

## Neon backend

The app uses Neon project `aged-field-28166908` in organization `org-plain-moon-07813839`. Production uses the `production` branch. PostgreSQL records live in the isolated `sheochand` schema; uploaded photos live in the private `assets` bucket and are served through `/media/<key>`.

`neon.ts` declares the bucket. Postgres is included with the project. Customers use Neon Auth email/password accounts. The original ChatGPT sign-in remains for the shop owner and customers with records attached to that original account. New email accounts never receive shop-management access.

Run `npx neon@latest deploy` to reconcile services and pull the branch's server-only variables into `.env`. Set these same secrets on the application host: `DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`. The unpooled database URL is for migration scripts, not application traffic. Never expose these values with a `NEXT_PUBLIC_` prefix.

The runtime uses `@neondatabase/serverless` over HTTPS because the existing Sites Worker runtime does not expose raw TCP or Hyperdrive bindings. Photo requests use `aws4fetch` with S3 SigV4, the injected region, and path-style bucket URLs. Existing `/images` and `/tryon` files remain static site assets.

## Migrations

`db/schema.ts` and `drizzle-postgres/` are the active Drizzle schema and migrations. Generate new migrations with `npm run db:generate`, inspect the SQL, then apply with `npm run db:migrate`. The runner uses the unpooled URL and applies each Drizzle migration atomically with its checksum record. Stock-reservation triggers are included in the initial Postgres migration. Never modify an applied migration.

The historical `drizzle/` SQLite migrations and original D1/R2 resources are retained for reference/recovery; the app no longer uses their bindings. `scripts/import-d1.mjs` imports a complete, private export into empty application tables and copies any referenced `/media/` photographs. It refuses a nonempty destination and records an import marker. No source export or environment secret is committed.

## Local checks

Use a disposable verification branch before running fixture checks:

```powershell
npx neon@latest checkout sheochand-neon-verify --create
npm run db:migrate
npm run dev
```

On a branch already cloned from production, migration history and data are inherited. Do not reimport the original D1 export. In a second terminal:

```powershell
node scripts/check-money.mjs
node --env-file=.env scripts/check-shop.mjs
node scripts/check-login.mjs
node scripts/check-admin.mjs
node scripts/check-admin-layout.mjs
node scripts/check-dev.mjs
node scripts/check.mjs
node --env-file=.env scripts/check-neon-services.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

The shop check requires the verification branch and an empty local test account bag. It tests content persistence, totals, stock reservations, retries and account ownership, then removes its database fixtures and restores the content. The service check proves both services through the app and independently through their database/storage APIs, then removes its own product and photo. Broader fixture checks belong on the disposable branch.

Return to production with `npx neon@latest checkout production`. Restart the local app after changing branch environment variables. Local preview still uses real Neon services on the selected branch.

## Customer login

The public account routes are `/login`, `/signup`, `/forgot-password` and `/reset-password`. The same-origin `/api/auth/*` SDK proxy talks to Managed Neon Auth. Server handlers validate the session before accessing customer bags, orders and try-on. Customer IDs use the `neon:` prefix, keeping them separate from original platform identities. Existing orders are not silently merged by email address; use the original ChatGPT sign-in for those records.

Enable Auth through `neon.ts` and `npx neon@latest deploy`. Register the actual website origin with `npx neon@latest neon-auth domain add <origin>`. Local testing at `http://127.0.0.1:5173` needs that exact origin registered too. Generate a random 32+ character `NEON_AUTH_COOKIE_SECRET` once, retain it in the ignored environment file, and configure it as a hosting secret along with `NEON_AUTH_BASE_URL`.

Password recovery uses Managed Auth's email provider. The shared testing sender is currently configured; delivery has not been verified in a real inbox. Configure business SMTP in Neon Auth before a full production email rollout. Email verification is currently disabled; customer signups cannot grant admin rights. Owner access continues through the existing authorised platform account.

To test authentication safely, create `sheochand-login-verify` from production, register its local origin and run `node --env-file=.env scripts/check-customer-auth.mjs` against the local app. The test creates only disposable accounts with `example.invalid` email addresses. Delete that verification branch after testing. No real email delivery is asserted.

## Shopping experience

`/shop` is the full catalogue: search, collection and style filters, in-stock ordering filter, price/name sorting, and saved selections (shared with the homepage). Filters are reflected in the URL. Product pages include an enlarged photo, quantity selection, specifications, policies and related pieces. Prices and inventory come from **Collection** in admin; unpriced pieces offer a WhatsApp price enquiry and cannot be ordered. No stock, material claims, reviews or discounts are fabricated.

`/cart` manages quantities and shows totals. `/checkout` collects contact and pickup/delivery details and requires consent before an unpaid order request is created. Checkout is available only to signed-in customers. Delivery is shown only when enabled in Website content. Order pages show progress, payment status, dispatch/pickup notes and a printable order summary. Shop confirmation and recording of payment still happen under Customer orders in admin.

Before launch, add verified final prices and stock to the real products, replace illustrative catalogue copy, and complete business contact and shop policies. This checkout does not collect online payments.
