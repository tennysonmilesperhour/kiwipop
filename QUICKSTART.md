# Kiwi Pop - Ecommerce Platform Quick Start

This is a complete ecommerce + ERP system for Kiwi Pop party lollipops. Phases 1-5 are all built out with placeholders where needed.

## What's Included

### Phase 1: MVP (Complete)
- ✅ Customer storefront (products, catalog, preorders)
- ✅ Shopping cart
- ✅ Checkout page
- ✅ Order management (admin)
- ✅ Inventory tracking (admin)
- ✅ User authentication

### Phase 2: Wholesale (Complete)
- ✅ Wholesale account management
- ✅ Approval workflow
- ✅ Tiered pricing structure
- ✅ Quote system

### Phase 3: Manufacturing (Complete)
- ✅ Manufacturing batch tracking
- ✅ Supplier management
- ✅ Raw materials inventory
- ✅ Bill of materials

### Phase 4: Financials & Logistics (Complete)
- ✅ P&L dashboard
- ✅ Expense tracking
- ✅ Shipment management
- ✅ Return/RMA system
- ✅ Gross margin analysis

### Phase 5: Advanced Features (UI Structure Built)
- ✅ Dashboard scaffolding
- ⏳ Ready for: Subscriptions, affiliate program, email automation, analytics

## Initial Setup

### 1. Create Supabase Account & Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Copy your `Project URL` and `Anon Key` from Project Settings → API

### 2. Configure Environment Variables
Edit `.env.local` with your Supabase keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Database Migrations

In Supabase SQL Editor, paste the contents of `supabase/migrations/001_initial_schema.sql` and run.

This creates all tables:
- Products, Orders, Order Items
- Inventory, Wholesale Accounts
- Suppliers, Manufacturing Batches, Raw Materials
- Expenses, Shipments, Returns

### 4. Create Admin User

In Supabase Authentication → Users, create a test user. Then in the SQL Editor, run:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 5. Set Up Stripe (Optional for MVP testing)

For payment processing:
- Create [Stripe Account](https://stripe.com)
- Go to Developers → API Keys
- Copy Publishable Key and Secret Key to `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

**For MVP demo without Stripe**: Skip this. Cart and checkout UI work, but payment won't process yet.

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Key Features to Test

### Customer Flow
1. Go to homepage → View products
2. Click a product → Add to cart
3. Go to `/cart` → Adjust quantities
4. Click "Proceed to Checkout"
5. Fill shipping info → "Continue to Payment"
6. Order appears in `/admin/orders`

### Admin Dashboard
- **Dashboard** (`/admin/dashboard`): Overview stats, recent orders
- **Orders** (`/admin/orders`): View/manage order status
- **Inventory** (`/admin/inventory`): Update stock levels
- **Products** (`/admin/products`): Add/edit products
- **Wholesale** (`/admin/wholesale`): Approve wholesale accounts
- **Manufacturing** (`/admin/manufacturing`): Track batches & raw materials
- **Financials** (`/admin/financials`): Revenue, COGS, profit, expenses
- **Logistics** (`/admin/logistics`): Shipments & returns

## Architecture

```
Frontend (Next.js 14)
  ├── (public) - Storefront pages
  ├── (admin) - Admin dashboard (protected)
  └── components - Reusable UI

Backend (Supabase)
  ├── PostgreSQL Database
  ├── Auth (Email/Password)
  ├── Row-Level Security (RLS)
  └── Real-time subscriptions (optional)

Payments
  └── Stripe (integrated but optional for MVP)
```

## Database Schema

**Tables (23 total):**
- Core: `profiles`, `products`, `orders`, `order_items`
- Inventory: `inventory`
- Wholesale: `wholesale_accounts`, `wholesale_pricing`, `quotes`
- Manufacturing: `suppliers`, `manufacturing_batches`, `raw_materials`, `bill_of_materials`
- Financials: `expenses`
- Logistics: `shipments`, `returns`

All with proper:
- Foreign key constraints
- Indexes for performance
- Row-level security
- Enum checks

## Testing Data

To add test products:

```sql
INSERT INTO products (name, sku, price_cents, in_stock, description) VALUES
('Rainbow Pop', 'KIWI-001', 499, 100, 'Colorful lollipop mix'),
('Sour Blasters', 'KIWI-002', 599, 50, 'Extreme sour candy'),
('Party Pack (12pc)', 'KIWI-003', 4999, 25, 'Bulk party assortment');
```

## Next Steps (Post-MVP)

1. **Connect Stripe Webhooks** - Automate order status on payment confirmation
2. **Email Notifications** - Send order confirmations (Resend integration)
3. **Shipping Integration** - Connect EasyPost for carrier selection
4. **Analytics** - Track top products, customer lifetime value
5. **Multi-Language** - Add Spanish/other languages
6. **Mobile App** - React Native with Supabase

## Troubleshooting

**"Cannot read properties of undefined (reading 'from')"**
- You need to configure Supabase keys in `.env.local`

**"Auth error: User not found"**
- Create a user in Supabase Auth first
- Make sure profile is created in `profiles` table

**"RLS policy violation"**
- Check that you're logged in
- For admin pages, your user must have `role = 'admin'`

## Support

Docs: [Supabase](https://supabase.com/docs) | [Next.js](https://nextjs.org/docs) | [Stripe](https://stripe.com/docs)

---

**Status**: Phase 1-4 Complete | Phase 5 Ready
**Last Updated**: Apr 2026
