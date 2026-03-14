"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { ClockIcon, CalendarIcon } from "@heroicons/react/24/outline";

// Business hours and scheduling constraints (locked decisions)
const MIN_LEAD_TIME_MINUTES = 30;     // Minimum time before scheduled pickup
const MAX_DAYS_AHEAD = 7;             // Maximum days in advance to schedule
const BUSINESS_HOURS_OPEN = 11;       // 11 AM
const BUSINESS_HOURS_CLOSE = 21;      // 9 PM
const PREP_TIME_MINUTES = 90;         // Kitchen prep time
const BUFFER_MINUTES = 30;            // Safety buffer before close
// Effective last slot: 9 PM - 90 min - 30 min = 7:00 PM (19:00)
const LAST_SLOT_HOUR = BUSINESS_HOURS_CLOSE - Math.ceil((PREP_TIME_MINUTES + BUFFER_MINUTES) / 60); // 19

interface TimeSlot {
  time: string;
  displayText: string;
  isAvailable: boolean;
}

interface TimeSlotPickerProps {
  selectedDateTime: Date | null;
  onSelect: (dateTime: Date) => void;
  minLeadTimeMinutes?: number;
}

export function TimeSlotPicker({
  selectedDateTime,
  onSelect,
  minLeadTimeMinutes = MIN_LEAD_TIME_MINUTES
}: TimeSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate available dates (today + MAX_DAYS_AHEAD days)
  const today = new Date();
  const availableDates = Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return {
      value: date.toISOString().split('T')[0],
      display: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    };
  });

  // Fetch time slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const loadSlots = async () => {
      setLoading(true);
      try {
        const response = await apiClient(
          `/ScheduledOrders/timeslots?date=${selectedDate}&leadTimeMinutes=${minLeadTimeMinutes}`
        );
        setAvailableSlots(response.availableSlots || []);
      } catch (error) {
        console.error("Failed to load time slots:", error);
        // Fallback: Generate default slots
        generateDefaultSlots();
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [selectedDate, minLeadTimeMinutes]);

  const generateDefaultSlots = () => {
    const slots: TimeSlot[] = [];
    // Use business hours constants: 11 AM to 7 PM (last slot due to prep time)
    const startHour = BUSINESS_HOURS_OPEN;
    const endHour = LAST_SLOT_HOUR; // 7 PM (19:00) - accounts for prep + buffer

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let min = 0; min < 60; min += 15) {
        // Skip slots after 7:00 PM
        if (hour === LAST_SLOT_HOUR && min > 0) continue;

        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const dateTime = new Date(`${selectedDate}T${time}`);
        const minTime = new Date(Date.now() + minLeadTimeMinutes * 60000);

        // Slot is available if it's in the future (with lead time buffer)
        const isAvailable = dateTime > minTime;

        slots.push({
          time,
          displayText: dateTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          isAvailable
        });
      }
    }

    setAvailableSlots(slots);
  };

  // Combine date and time when both selected
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      onSelect(dateTime);
    }
  }, [selectedDate, selectedTime, onSelect]);

  return (
    <div className="space-y-4">
      {/* Date Selection */}
      <div>
        <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
          <CalendarIcon className="w-4 h-4 inline mr-1" />
          Select Date
        </label>
        <select
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedTime("");
          }}
          className="input w-full"
        >
          <option value="">Choose a date...</option>
          {availableDates.map((date) => (
            <option key={date.value} value={date.value}>
              {date.display}
            </option>
          ))}
        </select>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div>
          <label className="block text-sm font-semibold text-[#4A4A5A] mb-1">
            <ClockIcon className="w-4 h-4 inline mr-1" />
            Select Time
          </label>
          <p className="text-xs text-[#71717A] mb-2">
            Available pickup times: 11:00 AM - 7:00 PM (Open 11 AM - 9 PM)
          </p>
          
          {loading ? (
            <div className="flex gap-2 flex-wrap">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-20 h-10 bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-[#71717A]">
              No available times for this date. Please select another date.
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.isAvailable && setSelectedTime(slot.time)}
                  disabled={!slot.isAvailable}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTime === slot.time
                      ? "bg-[#1E5AA8] text-white"
                      : slot.isAvailable
                        ? "bg-white border border-gray-200 hover:border-[#1E5AA8] text-[#1A1A2E]"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {slot.displayText}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {selectedDateTime && (
        <div className="mt-4 p-4 bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)] rounded-lg">
          <p className="text-sm font-semibold text-[#1A1A2E]">
            Pickup scheduled for:
          </p>
          <p className="text-lg font-bold text-[#D4AF37]">
            {selectedDateTime.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })} at {selectedDateTime.toLocaleTimeString('en-US', { 
              hour: 'numeric',
              minute: '2-digit',
              hour12: true 
            })}
          </p>
        </div>
      )}
    </div>
  );
}

// Utility to format scheduled time
export function formatScheduledTime(dateTime: Date | string): string {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
