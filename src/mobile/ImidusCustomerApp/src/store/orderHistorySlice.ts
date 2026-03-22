/**
 * Order History Redux Slice
 * State management for order history feature
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  OrderHistoryItem,
  OrderDetail,
  OrderHistoryState,
} from '../types/orderHistory.types';
import {
  fetchOrderHistory as fetchOrderHistoryApi,
  fetchOrderDetails as fetchOrderDetailsApi,
} from '../services/orderHistoryService';

const initialState: OrderHistoryState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  detailLoading: false,
  error: null,
};

/**
 * Async thunk to fetch order history for a customer
 */
export const fetchOrderHistory = createAsyncThunk(
  'orderHistory/fetchHistory',
  async (
    { customerId, page = 1, pageSize = 20 }: { customerId: number; page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetchOrderHistoryApi(customerId, page, pageSize);
      return response.orders;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch order history');
    }
  }
);

/**
 * Async thunk to fetch order details
 */
export const fetchOrderDetails = createAsyncThunk(
  'orderHistory/fetchDetails',
  async (orderId: number, { rejectWithValue }) => {
    try {
      const response = await fetchOrderDetailsApi(orderId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch order details');
    }
  }
);

const orderHistorySlice = createSlice({
  name: 'orderHistory',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<OrderHistoryItem[]>) => {
      state.orders = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    selectOrder: (state, action: PayloadAction<OrderDetail | null>) => {
      state.selectedOrder = action.payload;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    clearOrderHistory: (state) => {
      state.orders = [];
      state.selectedOrder = null;
      state.loading = false;
      state.detailLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(fetchOrderHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchOrderDetails.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedOrder = action.payload;
        state.error = null;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setOrders,
  setLoading,
  setError,
  selectOrder,
  clearSelectedOrder,
  clearOrderHistory,
} = orderHistorySlice.actions;

export default orderHistorySlice.reducer;
