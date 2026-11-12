import { useEffect, useState } from 'react';
import { fetchUserPricing } from '../services/api';

export interface RegionalPricing {
  isIndia: boolean;
  currency: 'INR' | 'USD';
  amount: number;
  displayPrice: string;
  timezone: string;
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
}

export function isLikelyIndiaTimezone(tz?: string): boolean {
  const resolved = tz || getUserTimezone();
  if (resolved) {
    return resolved === 'Asia/Kolkata' || resolved === 'Asia/Calcutta';
  }
  try {
    return new Date().getTimezoneOffset() === -330;
  } catch {
    return true;
  }
}

export function getInitialPricing(inrAmount = 499): RegionalPricing {
  const timezone = getUserTimezone();
  const isIndia = isLikelyIndiaTimezone(timezone);
  const cleanInr = inrAmount && inrAmount > 0 ? Math.round(inrAmount) : 499;

  if (isIndia) {
    return {
      isIndia: true,
      currency: 'INR',
      amount: cleanInr,
      displayPrice: `${cleanInr} INR`,
      timezone,
    };
  }

  return {
    isIndia: false,
    currency: 'USD',
    amount: 10,
    displayPrice: '$10 USD',
    timezone,
  };
}

export function useRegionalPricing(inrAmount = 499): RegionalPricing {
  const [pricing, setPricing] = useState<RegionalPricing>(() => getInitialPricing(inrAmount));

  useEffect(() => {
    let active = true;
    const tz = getUserTimezone();
    fetchUserPricing(tz).then((serverPricing) => {
      if (!active || !serverPricing) return;
      const isIndia = serverPricing.isIndia !== false;
      const cleanInr = inrAmount && inrAmount > 0 ? Math.round(inrAmount) : serverPricing.amount || 499;
      setPricing(
        isIndia
          ? {
              isIndia: true,
              currency: 'INR',
              amount: cleanInr,
              displayPrice: `${cleanInr} INR`,
              timezone: tz,
            }
          : {
              isIndia: false,
              currency: 'USD',
              amount: 10,
              displayPrice: '$10 USD',
              timezone: tz,
            }
      );
    });
    return () => {
      active = false;
    };
  }, [inrAmount]);

  return pricing;
}

