'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from './supabase';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useOrderWithItems(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(*)')
        .eq('order_id', orderId);
      if (itemsError) throw itemsError;

      return { ...order, items };
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (orderData: {
      items: Array<{ productId: string; quantity: number; price: number; isPreorder: boolean }>;
      userEmail: string;
      shippingAddress: any;
    }) => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: null,
          status: 'pending',
          total_cents: orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          user_email: orderData.userEmail,
          shipping_address: orderData.shippingAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_cents: item.price,
        is_preorder: item.isPreorder,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      return order;
    },
  });
}
