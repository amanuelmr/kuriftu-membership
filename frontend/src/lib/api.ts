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

// API functions

// Auth
export async function login(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function register(userData: {
  fname: string;
  lname: string;
  email: string;
  phone: string;
  password: string;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fname: userData.fname,
        lname: userData.lname,
        email: userData.email,
        phone: userData.phone,
        password: userData.password
      })
    });

    if (!response.ok) {
      throw new Error("Registration failed");
    }
    return await response.json();
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// User
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    return await response.json();
  } catch (error) {
    console.error("Get user error:", error);
    throw error;
  }
}

export async function updateUserProfile(userData: Partial<User>) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
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
  try {
    const response = await fetch(`${API_BASE_URL}/survey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(survey)
    });

    if (!response.ok) {
      throw new Error("Failed to submit survey");
    }

    return await response.json();
  } catch (error) {
    console.error("Submit survey error:", error);
    throw error;
  }
}

// Bookings
export async function getBookings(status?: string): Promise<Booking[]> {
  try {
    const url = status
      ? `${API_BASE_URL}/bookings?status=${status}`
      : `${API_BASE_URL}/bookings`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }

    return await response.json();
  } catch (error) {
    console.error("Get bookings error:", error);
    throw error;
  }
}

// Points
export async function getPointsBalance(): Promise<{
  available: number;
  lifetime: number;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/points/balance`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch points balance");
    }

    return await response.json();
  } catch (error) {
    console.error("Get points balance error:", error);
    throw error;
  }
}

export async function getPointsHistory(): Promise<PointsTransaction[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/points/history`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch points history");
    }

    return await response.json();
  } catch (error) {
    console.error("Get points history error:", error);
    throw error;
  }
}

// Rewards
export async function getRewards(category?: string): Promise<Reward[]> {
  try {
    const url = category
      ? `${API_BASE_URL}/rewards?category=${category}`
      : `${API_BASE_URL}/rewards`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch rewards");
    }

    return await response.json();
  } catch (error) {
    console.error("Get rewards error:", error);
    throw error;
  }
}

export async function redeemReward(rewardId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/rewards/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ rewardId })
    });

    if (!response.ok) {
      throw new Error("Failed to redeem reward");
    }

    return await response.json();
  } catch (error) {
    console.error("Redeem reward error:", error);
    throw error;
  }
}

// Offers
export async function getOffers(): Promise<Offer[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/offers`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch offers");
    }

    return await response.json();
  } catch (error) {
    console.error("Get offers error:", error);
    throw error;
  }
}

// Membership
export async function getMembershipBenefits(): Promise<MembershipBenefit[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/membership/benefits`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch membership benefits");
    }

    return await response.json();
  } catch (error) {
    console.error("Get membership benefits error:", error);
    throw error;
  }
}

export async function upgradeMembership(tier: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/membership/upgrade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ tier })
    });

    if (!response.ok) {
      throw new Error("Failed to upgrade membership");
    }

    return await response.json();
  } catch (error) {
    console.error("Upgrade membership error:", error);
    throw error;
  }
}

// Payment Methods
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/payment-methods`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch payment methods");
    }

    return await response.json();
  } catch (error) {
    console.error("Get payment methods error:", error);
    throw error;
  }
}

export async function addPaymentMethod(paymentData: {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  setAsDefault: boolean;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/payment-methods`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error("Failed to add payment method");
    }

    return await response.json();
  } catch (error) {
    console.error("Add payment method error:", error);
    throw error;
  }
}

export async function getPaymentHistory(): Promise<Payment[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/history`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch payment history");
    }

    return await response.json();
  } catch (error) {
    console.error("Get payment history error:", error);
    throw error;
  }
}

// Payments via Chapa: initialize opens a hosted checkout; the caller redirects
// the browser to checkoutUrl. After Chapa returns the user, verify confirms it.
export async function initializePayment(input: {
  amount: string;
  currency?: string;
  description?: string;
  purpose?: string;
  targetTier?: string;
}): Promise<{ checkoutUrl: string; txRef: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      throw new Error("Failed to start payment");
    }

    return await response.json();
  } catch (error) {
    console.error("Initialize payment error:", error);
    throw error;
  }
}

export async function verifyPayment(txRef: string): Promise<Payment> {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/verify/${txRef}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to verify payment");
    }

    return await response.json();
  } catch (error) {
    console.error("Verify payment error:", error);
    throw error;
  }
}

// getToken is provided by ./auth (single source of truth for the JWT).
