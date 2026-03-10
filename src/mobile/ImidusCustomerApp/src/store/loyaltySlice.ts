import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import apiClient from '../api/apiClient';

interface LoyaltyTransaction {
  id: number;
  date: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
}

interface LoyaltyState {
  customerId: number | null;
  balance: number;
  transactions: LoyaltyTransaction[];
  loading: boolean;
  error: string | null;
}

const initialState: LoyaltyState = {
  customerId: null,
  balance: 0,
  transactions: [],
  loading: false,
  error: null,
};

// Async thunk for customer lookup
export const fetchCustomerLoyalty = createAsyncThunk(
  'loyalty/fetchCustomer',
  async ({phone, email}: {phone?: string; email?: string}) => {
    const params = new URLSearchParams();
    if (phone) params.append('phone', phone);
    if (email) params.append('email', email);

    const response = await apiClient.get(`/api/customers/lookup?${params}`);
    return response.data; // { customerId, fullName, phone, email, earnedPoints }
  },
);

// Async thunk for transaction history
export const fetchLoyaltyHistory = createAsyncThunk(
  'loyalty/fetchHistory',
  async (customerId: number) => {
    const response = await apiClient.get(
      `/api/customers/${customerId}/loyalty-history`,
    );
    return response.data; // LoyaltyTransaction[]
  },
);

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    clearLoyalty: state => {
      state.customerId = null;
      state.balance = 0;
      state.transactions = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    // fetchCustomerLoyalty
    builder.addCase(fetchCustomerLoyalty.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomerLoyalty.fulfilled, (state, action) => {
      state.customerId = action.payload.customerId;
      state.balance = action.payload.earnedPoints;
      state.loading = false;
    });
    builder.addCase(fetchCustomerLoyalty.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to load loyalty data';
    });

    // fetchLoyaltyHistory
    builder.addCase(fetchLoyaltyHistory.pending, state => {
      state.loading = true;
    });
    builder.addCase(fetchLoyaltyHistory.fulfilled, (state, action) => {
      state.transactions = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchLoyaltyHistory.rejected, (state, action) => {
      state.loading = false;
      state.error =
        action.error.message || 'Failed to load transaction history';
    });
  },
});

export const {clearLoyalty} = loyaltySlice.actions;
export default loyaltySlice.reducer;
