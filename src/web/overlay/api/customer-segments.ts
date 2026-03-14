/**
 * Customer Segments API
 * 
 * Provides customer data fetching from POS for targeting purposes.
 * 
 * SSOT Compliance:
 * - READ from INI_Restaurant for customer data
 * - NO writes to POS database
 */

import { posDb } from '@/lib/db';
import type { CustomerRFMData } from '@/lib/segments';

/**
 * Fetch customer data from POS for segmentation
 */
export async function fetchCustomerDataFromPOS(
  customerId: string
): Promise<CustomerRFMData | null> {
  try {
    const result = await posDb.query(
      "SELECT CustomerID, LifetimeValue, VisitCount, LastOrderDate, BirthDate FROM tblCustomer WHERE CustomerID = $1",
      [customerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const customer = result.rows[0];
    
    // Calculate days since last order
    let days_since_last_order: number | null = null;
    if (customer.LastOrderDate) {
      const lastOrder = new Date(customer.LastOrderDate);
      const today = new Date();
      days_since_last_order = Math.floor((today.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Calculate days until birthday
    let days_until_birthday: number | null = null;
    if (customer.BirthDate) {
      const birthDate = new Date(customer.BirthDate);
      const today = new Date();
      birthDate.setFullYear(today.getFullYear());
      
      // If birthday has passed this year, check next year
      if (birthDate < today) {
        birthDate.setFullYear(today.getFullYear() + 1);
      }
      
      days_until_birthday = Math.floor((birthDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      customerId: customer.CustomerID?.toString() || customerId,
      lifetime_value: customer.LifetimeValue || 0,
      visit_count: customer.VisitCount || 0,
      last_order_date: customer.LastOrderDate || null,
      birthdate: customer.BirthDate || null,
      days_since_last_order,
      days_until_birthday
    };
  } catch (error) {
    console.error('Error fetching customer data from POS:', error);
    return null;
  }
}
