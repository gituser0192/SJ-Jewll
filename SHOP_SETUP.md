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

`neon.ts` declares the bucket. Postgres is included with the project. Authentication remains the existing ChatGPT sign-in; Neon Auth was not enabled.

Run `npx neon@latest deploy` to reconcile services and pull the branch's server-only variables into `.env`. Set these same secrets on the application host: `DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, and `AWS_REGION`. The unpooled database URL is for migration scripts, not application traffic. Never expose these values with a `NEXT_PUBLIC_` prefix.

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
