export const customerCte=`WITH order_totals AS (
 SELECT owner_id,count(*)::int AS order_count,coalesce(sum(total_paise) FILTER(WHERE payment_status='PAID'),0)::bigint AS paid_paise,min(created_at) AS first_order_at,max(created_at) AS last_order_at FROM sheochand.orders GROUP BY owner_id
),latest_orders AS (
 SELECT DISTINCT ON(owner_id) owner_id,full_name,email,phone FROM sheochand.orders ORDER BY owner_id,created_at DESC,id DESC
),accounts AS (
 SELECT 'neon:'||id::text AS owner_id,name,email,"emailVerified" AS verified,to_char("createdAt" AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS joined_at,'email'::text AS source FROM neon_auth."user" WHERE 'neon:'||id::text<>$1
),customers AS (
 SELECT * FROM accounts UNION ALL
 SELECT o.owner_id,o.full_name AS name,o.email,NULL::boolean AS verified,t.first_order_at AS joined_at,'orders'::text AS source FROM latest_orders o JOIN order_totals t USING(owner_id) WHERE lower(o.email)<>$2 AND o.owner_id<>$1 AND NOT EXISTS(SELECT 1 FROM neon_auth."user" u WHERE 'neon:'||u.id::text=o.owner_id)
)`;
export const customerStatsSql=customerCte+` SELECT
 (SELECT count(*)::int FROM customers) AS customers,
 (SELECT count(*)::int FROM customers WHERE source='email' AND joined_at::timestamptz>=now()-interval '30 days') AS new_customers,
 (SELECT count(*)::int FROM sheochand.login_events WHERE kind='signin' AND user_id<>$1) AS signins,
 (SELECT count(*)::int FROM sheochand.login_events WHERE kind='signin' AND user_id<>$1 AND created_at>=date_trunc('day',now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata') AS signins_today,
 (SELECT count(*)::int FROM neon_auth.session WHERE "expiresAt">now() AND 'neon:'||"userId"::text<>$1) AS active_sessions,
 (SELECT count(*)::int FROM sheochand.orders WHERE status='PENDING') AS pending_orders,
 (SELECT value FROM sheochand.settings WHERE key='login_tracking_started_at') AS tracking_started_at`;
const search=`(c.name ILIKE $3 OR c.email ILIKE $3 OR EXISTS(SELECT 1 FROM latest_orders l WHERE l.owner_id=c.owner_id AND l.phone ILIKE $3))`;
export const customerCountSql=customerCte+` SELECT count(*)::int AS total FROM customers c WHERE `+search;
export const customerDirectorySql=customerCte+` SELECT c.*,coalesce(t.order_count,0) AS order_count,coalesce(t.paid_paise,0) AS paid_paise,t.last_order_at,l.phone,
 (SELECT count(*)::int FROM sheochand.login_events e WHERE e.user_id=c.owner_id AND e.kind='signin') AS signins,
 (SELECT max(created_at) FROM sheochand.login_events e WHERE e.user_id=c.owner_id AND e.kind='signin') AS last_signin_at,
 (SELECT max("createdAt") FROM neon_auth.session s WHERE 'neon:'||s."userId"::text=c.owner_id) AS last_session_at
 FROM customers c LEFT JOIN order_totals t USING(owner_id) LEFT JOIN latest_orders l USING(owner_id) WHERE `+search+` ORDER BY c.joined_at::timestamptz DESC,c.owner_id LIMIT 25 OFFSET $4`;
