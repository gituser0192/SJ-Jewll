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

## Local checks

Run the existing dev server at `http://127.0.0.1:5173`. Local and hosted databases are separate. Migration `0003_glamorous_felicia_hardy.sql` has already been applied to this local preview; do not replay it. Sites applies pending hosted migrations when publishing.

With an empty local shopping bag, run:

```powershell
node scripts/check-money.mjs
node scripts/check-shop.mjs
node scripts/check-login.mjs
node scripts/check-admin.mjs
node scripts/check-admin-layout.mjs
node scripts/check-dev.mjs
node scripts/check.mjs
node node_modules/typescript/bin/tsc --noEmit
```

The shop check creates temporary local products and orders, tests content persistence, totals, stock reservations, retries and account ownership, then removes its fixtures and restores the content. Never run these fixture checks against production.
