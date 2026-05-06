/** Request body for POST /api/v1/order */

export interface OrderProductLine {
  productId: string;
  quantity: number;
  price: number;
  sku: string;
  /** Selected variant size label — backend expects a string, not the catalog size[] array */
  size: string;
}

export interface BillingAddressPayload {
  email: string;
  contact: string;
  addressLine: string;
  province: string;
  zipCode: string;
  firstName: string;
  lastName: string;
}

export interface ShippingAddressPayload {
  email: string;
  contact: string;
  addressLine: string;
  province: string;
  zipCode: string;
}

export interface CreateOrderPayload {
  paymentMode: string;
  payment: boolean;
  totalBill: string;
  totalAmount: string;
  redeemValue: number;
  channel: string;
  couponCode: string;
  tax: null;
  product: OrderProductLine[];
  billingAddress: BillingAddressPayload;
  shippingAddress: ShippingAddressPayload;
}
