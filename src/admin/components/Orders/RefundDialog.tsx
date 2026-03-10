"use client";

import React, { useState } from "react";
import Modal from "@/components/Dialogs/Modal";
import FormBuilder, { FormField } from "@/components/Forms/FormBuilder";
import { useRefundOrder } from "@/lib/hooks";

interface RefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderTotal: number;
  onSuccess?: () => void;
}

export default function RefundDialog({
  isOpen,
  onClose,
  orderId,
  orderTotal,
  onSuccess,
}: RefundDialogProps) {
  const [values, setValues] = useState<Record<string, any>>({
    refundAmount: orderTotal,
    reason: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: refund, isPending } = useRefundOrder(orderId);

  const fields: FormField[] = [
    {
      name: "refundAmount",
      label: "Refund Amount ($)",
      type: "number",
      required: true,
      validation: (value) => {
        if (!value || parseFloat(value) <= 0)
          return "Amount must be greater than 0";
        if (parseFloat(value) > orderTotal / 100)
          return "Amount exceeds order total";
        return undefined;
      },
    },
    {
      name: "reason",
      label: "Reason",
      type: "select",
      required: true,
      options: [
        { value: "customer_request", label: "Customer Request" },
        { value: "order_error", label: "Order Error" },
        { value: "item_unavailable", label: "Item Unavailable" },
        { value: "duplicate_order", label: "Duplicate Order" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "notes",
      label: "Internal Notes",
      type: "textarea",
      placeholder: "Add any internal notes about this refund...",
    },
  ];

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && !values[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
      if (field.validation) {
        const error = field.validation(values[field.name]);
        if (error) newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit refund
    refund(
      {
        amountInCents: Math.round(parseFloat(values.refundAmount) * 100),
        reason: values.reason,
        notes: values.notes,
      },
      {
        onSuccess: () => {
          setValues({ refundAmount: orderTotal, reason: "", notes: "" });
          setErrors({});
          onClose();
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Refund" size="md">
      <FormBuilder
        fields={fields}
        values={values}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel={isPending ? "Processing..." : "Confirm Refund"}
        isLoading={isPending}
      />
    </Modal>
  );
}
