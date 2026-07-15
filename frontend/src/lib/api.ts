// This file contains all API calls to the backend.
// The base URL is configured via NEXT_PUBLIC_API_URL (see .env.example).
import { getToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";


// Types for API responses
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  membershipTier: "Basic" | "Golden" | "Platinum" | "Diamond";
  membershipId: string;
  memberSince: string;
  expiryDate: string;
  points: number;
  lifetimePoints: number;
}

export interface Booking {
  id: string;
  title: string;
  location: string;
  image: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  price: string;
  amenities: string[];
}

export interface PointsTransaction {
  id: number;
  date: string;
  description: string;
  category: "stays" | "dining" | "spa" | "points";
  points: string;
  type: "earned" | "redeemed";
  amount: string;
  balance: string;
}

export interface Reward {
  id: string;
  image: string;
  title: string;
  description: string;
  pointsRequired: string;
  category: "stays" | "experiences" | "merchandise" | "services";
}

export interface Offer {
  id: string;
  image: string;
  title: string;
  description: string;
  expiry: string;
  discount: string;
}

export interface MembershipBenefit {
  name: string;
  golden: string | boolean;
  platinum: string | boolean;
  diamond: string | boolean;
}

export interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard" | "amex" | "discover";
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  name: string;
  isDefault: boolean;
}

export interface Payment {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "upcoming" | "completed" | "redeemed" | "failed";
  paymentMethod: string;
}

interface ApiFetchOptions extends RequestInit {
  /** Attach the Bearer token (default true; auth endpoints opt out). */
  auth?: boolean;
  /** Fallback error message when the server response has no usable one. */
  errorMessage?: string;
}

// Single fetch path for every API call: base-URL join, auth header, JSON
// encoding, and error unwrapping (the backend's envelope is {"error": "..."}).
async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, errorMessage, ...init } = options;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    headers.Authorization = `Bearer ${getToken()}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    let message = errorMessage ?? `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body?.error === "string" && body.error) {
        message = body.error;
      }
    } catch {
      // Non-JSON error body; keep the fallback message.
    }
    throw new Error(message);
  }

  return response.json();
}

// API functions

// Auth
export async function login(
  email: string,
  password: string
): Promise<{ token: string; user?: User }> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
    errorMessage: "Login failed",
  });
}

export async function register(userData: {
  fname: string;
  lname: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ token: string; user?: User }> {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(userData),
    auth: false,
    errorMessage: "Registration failed",
  });
}

// User
export async function getCurrentUser(): Promise<User> {
  return apiFetch("/users/me", { errorMessage: "Failed to fetch user data" });
}

export async function updateUserProfile(userData: Partial<User>) {
  return apiFetch("/users/me", {
    method: "PUT",
    body: JSON.stringify(userData),
    errorMessage: "Failed to update profile",
  });
}

// Survey
export interface SurveyData {
  visitPurpose: string;
  preferredAccommodation: string[];
  interests: string[];
  travelFrequency: string;
  specialOccasions?: string;
  additionalNotes?: string;
}

export async function submitSurvey(survey: SurveyData) {
  return apiFetch("/survey", {
    method: "POST",
    body: JSON.stringify(survey),
    errorMessage: "Failed to submit survey",
  });
}

// Bookings
export async function getBookings(status?: string): Promise<Booking[]> {
  return apiFetch(status ? `/bookings?status=${status}` : "/bookings", {
    errorMessage: "Failed to fetch bookings",
  });
}

// Points
export async function getPointsBalance(): Promise<{
  available: number;
  lifetime: number;
}> {
  return apiFetch("/points/balance", {
    errorMessage: "Failed to fetch points balance",
  });
}

export async function getPointsHistory(): Promise<PointsTransaction[]> {
  return apiFetch("/points/history", {
    errorMessage: "Failed to fetch points history",
  });
}

// Rewards
export async function getRewards(category?: string): Promise<Reward[]> {
  return apiFetch(category ? `/rewards?category=${category}` : "/rewards", {
    errorMessage: "Failed to fetch rewards",
  });
}

export async function redeemReward(rewardId: string) {
  return apiFetch("/rewards/redeem", {
    method: "POST",
    body: JSON.stringify({ rewardId }),
    errorMessage: "Failed to redeem reward",
  });
}

// Offers
export async function getOffers(): Promise<Offer[]> {
  return apiFetch("/offers", { errorMessage: "Failed to fetch offers" });
}

// Membership
export async function getMembershipBenefits(): Promise<MembershipBenefit[]> {
  return apiFetch("/membership/benefits", {
    errorMessage: "Failed to fetch membership benefits",
  });
}

export async function upgradeMembership(tier: string) {
  return apiFetch("/membership/upgrade", {
    method: "POST",
    body: JSON.stringify({ tier }),
    errorMessage: "Failed to upgrade membership",
  });
}

// Payment Methods
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return apiFetch("/payment-methods", {
    errorMessage: "Failed to fetch payment methods",
  });
}

export async function addPaymentMethod(paymentData: {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  setAsDefault: boolean;
}) {
  return apiFetch("/payment-methods", {
    method: "POST",
    body: JSON.stringify(paymentData),
    errorMessage: "Failed to add payment method",
  });
}

export async function getPaymentHistory(): Promise<Payment[]> {
  return apiFetch("/payments/history", {
    errorMessage: "Failed to fetch payment history",
  });
}

// Payments via Chapa: initialize opens a hosted checkout; the caller redirects
// the browser to checkoutUrl. After Chapa returns the user, verify confirms it.
export async function initializePayment(input: {
  amount?: string;
  currency?: string;
  description?: string;
  purpose?: string;
  targetTier?: string;
}): Promise<{ checkoutUrl: string; txRef: string }> {
  return apiFetch("/payments/initialize", {
    method: "POST",
    body: JSON.stringify(input),
    errorMessage: "Failed to start payment",
  });
}

export async function verifyPayment(txRef: string): Promise<Payment> {
  return apiFetch(`/payments/verify/${txRef}`, {
    errorMessage: "Failed to verify payment",
  });
}

// getToken is provided by ./auth (single source of truth for the JWT).
