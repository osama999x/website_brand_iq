import { apiClient, getApiV1Root } from "../lib/api";

export interface FeedbackItem {
  _id?: string;
  customerId?: string | null;
  email?: string | null;
  channel?: string | number | null;
  rating: number;
  comments?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CreateFeedbackPayload {
  customerId?: string;
  email?: string;
  channel?: string | number;
  rating: number;
  comments?: string;
}

export async function createFeedback(payload: CreateFeedbackPayload): Promise<FeedbackItem> {
  const res = await apiClient<{ msg: string; data: FeedbackItem }>("/feedback", {
    method: "POST",
    baseUrl: getApiV1Root(),
    body: payload as unknown as Record<string, unknown>,
  });
  return res.data;
}

export async function getAllFeedback(): Promise<FeedbackItem[]> {
  const res = await apiClient<{ msg: string; data: FeedbackItem[] }>("/feedback/all", {
    method: "GET",
    baseUrl: getApiV1Root(),
  });
  return res.data ?? [];
}

