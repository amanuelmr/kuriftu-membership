"use client";

import useSWR from "swr";
import {
  getCurrentUser,
  getBookings,
  getPointsBalance,
  getPointsHistory,
  getRewards,
  getOffers,
  getMembershipBenefits,
  getPaymentMethods,
  getPaymentHistory
} from "./api";

// User hooks
export function useUser() {
  const { data, error, isLoading, mutate } = useSWR("user", getCurrentUser);

  return {
    user: data,
    isLoading,
    isError: error,
    mutate
  };
}

// Bookings hooks
export function useBookings(status?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    status ? `bookings/${status}` : "bookings",
    () => getBookings(status)
  );

  return {
    bookings: data,
    isLoading,
    isError: error,
    mutate
  };
}

// Points hooks
export function usePointsBalance() {
  const { data, error, isLoading, mutate } = useSWR(
    "points/balance",
    getPointsBalance
  );

  return {
    pointsBalance: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function usePointsHistory() {
  const { data, error, isLoading, mutate } = useSWR(
    "points/history",
    getPointsHistory
  );

  return {
    pointsHistory: data,
    isLoading,
    isError: error,
    mutate
  };
}

// Rewards hooks
export function useRewards(category?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    category ? `rewards/${category}` : "rewards",
    () => getRewards(category)
  );

  return {
    rewards: data,
    isLoading,
    isError: error,
    mutate
  };
}

// Offers hooks
export function useOffers() {
  const { data, error, isLoading, mutate } = useSWR("offers", getOffers);

  return {
    offers: data,
    isLoading,
    isError: error,
    mutate
  };
}

// Membership hooks
export function useMembershipBenefits() {
  const { data, error, isLoading, mutate } = useSWR(
    "membership/benefits",
    getMembershipBenefits
  );

  return {
    benefits: data,
    isLoading,
    isError: error,
    mutate
  };
}

// Payment hooks
export function usePaymentMethods() {
  const { data, error, isLoading, mutate } = useSWR(
    "payment-methods",
    getPaymentMethods
  );

  return {
    paymentMethods: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function usePaymentHistory() {
  const { data, error, isLoading, mutate } = useSWR(
    "payments/history",
    getPaymentHistory
  );

  return {
    paymentHistory: data,
    isLoading,
    isError: error,
    mutate
  };
}
