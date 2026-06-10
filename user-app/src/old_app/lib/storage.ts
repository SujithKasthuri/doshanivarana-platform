const memoryStore: Record<string, string> = {};

// ─── Demo data seeded at module init ────────────────────────────────────────
// On React Native (Android/iOS) localStorage is unavailable so we pre-populate
// the in-memory store here — before any component mounts — guaranteeing that
// profile.tsx and bookings.tsx can always find the demo user's data.
const DEMO_BOOKINGS = [
  {
    id: 'BK-1007',
    devoteeName: 'Suresh Raina',
    mobile: '+91 98765 43216',
    poojaName: 'Rudra Abhishekam',
    temple: 'Sri Venkateswara Temple',
    dateTime: '05 Jun 2026, 10:00 AM',
    paymentStatus: 'Confirmed',
    amount: '₹1,500',
    pujari: 'Pt. Sharma Ji',
    deliveryStatus: 'Delivered',
    streamStatus: 'Ended',
    recordingStatus: 'Available',
    nakshatra: 'Swati',
    gotra: 'Bharadwaja',
    email: 'suresh.raina@example.com',
    deliveryAddress: 'Delhi, India',
  },
  {
    id: 'BK-0990',
    devoteeName: 'Suresh Raina',
    mobile: '+91 98765 43216',
    poojaName: 'Satyanarayana Pooja',
    temple: 'Sri Venkateswara Temple',
    dateTime: '01 Jun 2026, 08:00 AM',
    paymentStatus: 'Confirmed',
    amount: '₹2,000',
    pujari: 'Pt. Sharma Ji',
    deliveryStatus: 'Delivered',
    streamStatus: 'Ended',
    recordingStatus: 'Available',
    nakshatra: 'Swati',
    gotra: 'Bharadwaja',
    email: 'suresh.raina@example.com',
    deliveryAddress: 'Delhi, India',
  },
];

// Pre-seed into memory store only if not already set (avoids overwriting
// data that was saved to the web localStorage and mirrored into memory).
if (!memoryStore['doshanivarana_bookings']) {
  memoryStore['doshanivarana_bookings'] = JSON.stringify(DEMO_BOOKINGS);
}

// Pre-seed default demo session so profile shows "Suresh Raina" on first launch.
if (!memoryStore['doshanivarana_logged_in_user']) {
  memoryStore['doshanivarana_logged_in_user'] = JSON.stringify({ mobile: '+91 98765 43216' });
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) return val;
      } catch (e) {
        // ignore – fall through to memoryStore
      }
    }
    return memoryStore[key] ?? null;
  },
  setItem: (key: string, value: string): void => {
    // Always keep memoryStore in sync for native fallback
    memoryStore[key] = value;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        // ignore
      }
    }
  },
  removeItem: (key: string): void => {
    delete memoryStore[key];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // ignore
      }
    }
  }
};
