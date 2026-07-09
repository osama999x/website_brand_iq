import { apiClient, getApiV1Root } from "../lib/api";
import type { CreateOrderPayload } from "../types/order";

export interface CreateOrderResponse {
  _id: string;
  orderId: string;
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  const res = await apiClient<{ msg: string; data: CreateOrderResponse }>("/order", {
    method: "POST",
    baseUrl: getApiV1Root(),
    body: payload as unknown as Record<string, unknown>,
  });
  return res.data;
}

export interface OrderTrackingResponse {
  order: {
    _id: string;
    orderId: string;
    trackingId: string | null;
    status: string;
    placedOn: string;
    courierType: string | null;
    isDeliver: boolean;
  };
  timeline: Array<{
    time: string;
    status: string;
    deliveryPartner: string | null;
    message: string;
  }>;
}

export async function getOrderTracking(orderId: string): Promise<OrderTrackingResponse> {
  const res = await apiClient<{ msg: string; data: OrderTrackingResponse }>("/order/orderTracking", {
    method: "GET",
    baseUrl: getApiV1Root(),
    params: { orderId },
  });
  return res.data;
}

export interface ReturnOrderProductLine {
  productId: string;
  quantity: number;
  price: number;
  sku: string;
  size: string;
}

export interface ReturnOrderPayload {
  orderId: string;
  isOrderReturn: boolean;
  shipmentType: "pickup" | "dropoff";
  exchangeReason: string;
  returnProduct: ReturnOrderProductLine[];
  images?: string[];
}

export interface ReturnOrderResponse {
  msg: string;
  data: unknown;
}

export async function returnOrder(payload: ReturnOrderPayload): Promise<ReturnOrderResponse> {
  const res = await apiClient<ReturnOrderResponse>("/returnOrder", {
    method: "POST",
    baseUrl: getApiV1Root(),
    body: payload as unknown as Record<string, unknown>,
  });
  return res;
}

export interface CancelOrderResponse {
  msg: string;
}

export async function cancelOrder(orderId: string): Promise<CancelOrderResponse> {
  const normalizedOrderId = String(orderId ?? "").trim();
  if (!normalizedOrderId) {
    throw new Error("orderId is required");
  }

  try {
    return await apiClient<CancelOrderResponse>(`/order/${encodeURIComponent(normalizedOrderId)}/cancel`, {
      method: "POST",
      baseUrl: getApiV1Root(),
    });
  } catch {
    // Backward compatibility while backend/frontend routes are transitioning.
    try {
      return await apiClient<CancelOrderResponse>("/order/orderCancel", {
        method: "POST",
        baseUrl: getApiV1Root(),
        body: { orderId: normalizedOrderId },
      });
    } catch {
      return await apiClient<CancelOrderResponse>("/order/orderCancel", {
        method: "GET",
        baseUrl: getApiV1Root(),
        params: { orderId: normalizedOrderId },
      });
    }
  }
}
