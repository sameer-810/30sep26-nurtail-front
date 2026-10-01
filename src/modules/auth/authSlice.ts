import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type Role = "admin" | "rescue" | "foster" | "owner" | "vendor" | "vet";
export type OrgRole = "manager" | "staff";
export type VerificationStatus =
  "unverified" | "pending" | "verified" | "returned" | "rejected" | "revoked";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgRole: OrgRole | null;
  organisation: {
    id: string;
    name: string;
    type: "rescue" | "shelter" | "vendor" | "vet_practice";
    verificationStatus: VerificationStatus;
  } | null;
  phone?: string;
  postcode?: string;
  fosterProfile?: {
    capacity?: number;
    species?: string[];
    hasGarden?: boolean;
    notes?: string;
  } | null;
  vetProfile?: { practiceName?: string; rcvsNumber?: string } | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
};

const STORAGE_KEY = "nurtail.auth";

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, user: null };
    const parsed = JSON.parse(raw) as AuthState;
    return { accessToken: parsed.accessToken ?? null, user: parsed.user ?? null };
  } catch {
    return { accessToken: null, user: null };
  }
}

function persist(state: AuthState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / storage full: the session still works for this tab.
  }
}

const slice = createSlice({
  name: "auth",
  initialState: loadState(),
  reducers: {
    setAuth(state, action: PayloadAction<{ accessToken: string; user: AuthUser }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      persist(state);
    },
    /** Refresh the cached user (profile edits, org verification changes). */
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      persist(state);
    },
    clearAuth(state) {
      state.accessToken = null;
      state.user = null;
      persist(state);
    },
  },
});

export const { setAuth, setUser, clearAuth } = slice.actions;
export default slice.reducer;
