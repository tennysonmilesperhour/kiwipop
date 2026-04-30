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
  in_stock: z.boolean().default(true),
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
