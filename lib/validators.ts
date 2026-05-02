import { z } from 'zod';

export const shippingAddressSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  address: z.string().trim().min(1, 'Address is required').max(200),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  zip: z.string().trim().min(3, 'ZIP is required').max(20),
  country: z.string().trim().length(2, 'Country code must be 2 letters'),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

export const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(999),
});

export const checkoutRequestSchema = z.object({
  email: z.string().email().max(255),
  shippingAddress: shippingAddressSchema,
  items: z.array(checkoutItemSchema).min(1, 'Cart is empty').max(50),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  sku: z.string().trim().min(1).max(50),
  price_cents: z.number().int().positive(),
  preorder_only: z.boolean().default(false),
  preorder_deadline: z.string().datetime().nullable().optional(),
  in_stock: z.number().int().min(0).default(0),
  image_url: z.string().url().nullable().optional().or(z.literal('')),
});

export type ProductCreate = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial();
export type ProductUpdate = z.infer<typeof productUpdateSchema>;

export const inventoryAdjustSchema = z.object({
  productId: z.string().uuid(),
  quantityAvailable: z.number().int().min(0),
  quantityReserved: z.number().int().min(0).optional(),
  quantityPreordered: z.number().int().min(0).optional(),
});

export type InventoryAdjust = z.infer<typeof inventoryAdjustSchema>;

export const orderStatusSchema = z.enum([
  'pending',
  'paid',
  'shipped',
  'completed',
  'cancelled',
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderUpdateSchema = z.object({
  orderId: z.string().uuid(),
  status: orderStatusSchema,
});

export const expenseCreateSchema = z.object({
  category: z.enum(['materials', 'labor', 'shipping', 'marketing', 'overhead']),
  amount_cents: z.number().int().positive(),
  description: z.string().trim().max(500).optional(),
  receipt_url: z.string().url().nullable().optional().or(z.literal('')),
  expense_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  batch_id: z.string().uuid().nullable().optional(),
});

export type ExpenseCreate = z.infer<typeof expenseCreateSchema>;

export const batchCreateSchema = z.object({
  batch_number: z.string().trim().min(1).max(50),
  product_id: z.string().uuid(),
  quantity_ordered: z.number().int().positive(),
  supplier_id: z.string().uuid().nullable().optional(),
  status: z
    .enum(['draft', 'ordered', 'in_progress', 'completed', 'shipped'])
    .default('draft'),
  order_date: z.string().nullable().optional(),
  expected_delivery: z.string().nullable().optional(),
  cost_cents: z.number().int().min(0).default(0),
  notes: z.string().trim().max(2000).optional(),
});

export type BatchCreate = z.infer<typeof batchCreateSchema>;

export const shipmentCreateSchema = z.object({
  order_id: z.string().uuid(),
  carrier: z.enum(['usps', 'ups', 'fedex']),
  tracking_number: z.string().trim().min(1).max(100),
  label_url: z.string().url().nullable().optional().or(z.literal('')),
});

export type ShipmentCreate = z.infer<typeof shipmentCreateSchema>;

export const returnCreateSchema = z.object({
  order_id: z.string().uuid(),
  reason: z.string().trim().min(1).max(1000),
  status: z
    .enum(['pending', 'received', 'refunded', 'rejected'])
    .default('pending'),
  refund_amount_cents: z.number().int().min(0).default(0),
});

export type ReturnCreate = z.infer<typeof returnCreateSchema>;

export const wholesaleApprovalSchema = z.object({
  accountId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected']),
  tier: z.enum(['standard', 'premium']).optional(),
});

export type WholesaleApproval = z.infer<typeof wholesaleApprovalSchema>;

export const wholesaleApplicationSchema = z.object({
  business_name: z.string().trim().min(1, 'business name required').max(200),
  tax_id: z.string().trim().max(100).optional().or(z.literal('')),
  contact_email: z.string().email('valid email required').max(255),
  contact_phone: z.string().trim().max(40).optional().or(z.literal('')),
  expected_monthly_units: z.number().int().min(0).optional(),
  channel: z
    .enum(['retail-shop', 'cafe-bar', 'event-vendor', 'distributor', 'other'])
    .optional(),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
});

/**
 * Public wholesale contact form. No auth required — anyone can submit.
 * Goes to the wholesale_inquiries table and forwards a notification email
 * via /api/wholesale/inquire.
 */
export const wholesaleInquirySchema = z.object({
  business_name: z.string().trim().min(1, 'business name required').max(200),
  contact_name: z.string().trim().min(1, 'your name required').max(200),
  contact_email: z.string().email('valid email required').max(255),
  contact_phone: z.string().trim().max(40).optional().or(z.literal('')),
  location: z
    .string()
    .trim()
    .min(1, 'where are you located?')
    .max(200),
  business_type: z
    .enum(['retail-shop', 'cafe-bar', 'event-vendor', 'distributor', 'gym-studio', 'online-store', 'other'])
    .optional(),
  looking_to_order: z
    .string()
    .trim()
    .min(1, "tell us what you're looking to order")
    .max(2000),
  about_business: z.string().trim().max(2000).optional().or(z.literal('')),
  timeline: z.string().trim().max(200).optional().or(z.literal('')),
});

export type WholesaleInquiry = z.infer<typeof wholesaleInquirySchema>;

/**
 * Admin-side patch on a wholesale_inquiries row. Only the workflow
 * fields are mutable: contact status + a notify-status override (rarely
 * used; for when an admin manually clears a failed email forward).
 */
export const wholesaleInquiryUpdateSchema = z.object({
  status: z
    .enum(['new', 'contacted', 'catalog_sent', 'active', 'declined'])
    .optional(),
  notify_status: z
    .enum(['pending', 'sent', 'failed', 'skipped'])
    .optional(),
  notify_error: z.string().trim().max(2000).nullable().optional(),
});

export type WholesaleInquiryUpdate = z.infer<typeof wholesaleInquiryUpdateSchema>;

export type WholesaleApplication = z.infer<typeof wholesaleApplicationSchema>;

const SHEET_SLUG = /^[a-z0-9_-]+$/;

export const sheetUpsertSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(SHEET_SLUG, 'slug must be lowercase letters, numbers, dash, or underscore'),
  label: z.string().trim().min(1).max(100),
  embed_url: z
    .string()
    .url()
    .refine(
      (u) => u.startsWith('https://docs.google.com/') || u.startsWith('https://'),
      'must be an https:// URL'
    ),
  height_px: z.number().int().min(200).max(2000).optional(),
  position: z.number().int().min(0).max(999).optional(),
});

export type SheetUpsert = z.infer<typeof sheetUpsertSchema>;

export const wholesaleAccountUpdateSchema = z.object({
  approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  tier: z.enum(['standard', 'premium']).optional(),
  business_name: z.string().trim().min(1).max(200).optional(),
  tax_id: z.string().trim().max(100).optional().or(z.literal('')),
});

export type WholesaleAccountUpdate = z.infer<typeof wholesaleAccountUpdateSchema>;

export const wholesalePricingCreateSchema = z.object({
  product_id: z.string().uuid(),
  tier: z.enum(['standard', 'premium']),
  price_cents: z.number().int().positive(),
  min_quantity: z.number().int().positive(),
});

export type WholesalePricingCreate = z.infer<typeof wholesalePricingCreateSchema>;

export const supplierCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  contact_email: z.string().email().nullable().optional().or(z.literal('')),
  supplier_type: z.enum(['manufacturer', 'raw_material']),
  lead_time_days: z.number().int().min(0).nullable().optional(),
});

export type SupplierCreate = z.infer<typeof supplierCreateSchema>;
export const supplierUpdateSchema = supplierCreateSchema.partial();
export type SupplierUpdate = z.infer<typeof supplierUpdateSchema>;

export const rawMaterialCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().min(1).max(50),
  quantity_available: z.number().int().min(0).default(0),
  quantity_reserved: z.number().int().min(0).default(0),
  reorder_point: z.number().int().min(0).default(0),
  supplier_id: z.string().uuid().nullable().optional(),
});

export type RawMaterialCreate = z.infer<typeof rawMaterialCreateSchema>;
export const rawMaterialUpdateSchema = rawMaterialCreateSchema.partial();
export type RawMaterialUpdate = z.infer<typeof rawMaterialUpdateSchema>;

export const batchUpdateSchema = z.object({
  batch_number: z.string().trim().min(1).max(50).optional(),
  product_id: z.string().uuid().optional(),
  quantity_ordered: z.number().int().positive().optional(),
  quantity_completed: z.number().int().min(0).optional(),
  supplier_id: z.string().uuid().nullable().optional(),
  status: z
    .enum(['draft', 'ordered', 'in_progress', 'completed', 'shipped'])
    .optional(),
  order_date: z.string().nullable().optional(),
  expected_delivery: z.string().nullable().optional(),
  actual_delivery: z.string().nullable().optional(),
  cost_cents: z.number().int().min(0).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type BatchUpdate = z.infer<typeof batchUpdateSchema>;

export const shipmentUpdateSchema = z.object({
  carrier: z.enum(['usps', 'ups', 'fedex']).optional(),
  tracking_number: z.string().trim().min(1).max(100).optional(),
  label_url: z.string().url().nullable().optional().or(z.literal('')),
  shipped_at: z.string().datetime().nullable().optional(),
  delivered_at: z.string().datetime().nullable().optional(),
});

export type ShipmentUpdate = z.infer<typeof shipmentUpdateSchema>;

export const returnUpdateSchema = z.object({
  status: z
    .enum(['pending', 'received', 'refunded', 'rejected'])
    .optional(),
  reason: z.string().trim().min(1).max(1000).optional(),
  refund_amount_cents: z.number().int().min(0).optional(),
  process_refund: z.boolean().optional(),
});

export type ReturnUpdate = z.infer<typeof returnUpdateSchema>;
