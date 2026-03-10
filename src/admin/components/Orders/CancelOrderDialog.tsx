"use client";

import React, { useState } from "react";
import Modal from "@/components/Dialogs/Modal";
import FormBuilder, { FormField } from "@/components/Forms/FormBuilder";
import { useCancelOrder } from "@/lib/hooks";

interface CancelOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  onSuccess?: () => void;
}

export default function CancelOrderDialog({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}: CancelOrderDialogProps) {
  const [values, setValues] = useState<Record<string, any>>({
    reason: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: cancel, isPending } = useCancelOrder(orderId);

  const fields: FormField[] = [
    {
      name: "reason",
      label: "Cancellation Reason",
      type: "select",
      required: true,
      options: [
        { value: "customer_request", label: "Customer Request" },
        { value: "order_error", label: "Order Error" },
        { value: "item_unavailable", label: "Item Unavailable" },
        { value: "payment_failed", label: "Payment Failed" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "notes",
      label: "Internal Notes",
      type: "textarea",
      placeholder: "Add any internal notes about this cancellation...",
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
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit cancellation
    cancel(
      {
        reason: values.reason,
        notes: values.notes,
      },
      {
        onSuccess: () => {
          setValues({ reason: "", notes: "" });
          setErrors({});
          onClose();
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Order" size="md">
      <div className="space-y-4 mb-4">
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
          This action cannot be undone. The customer will be notified of the
          cancellation.
        </div>
      </div>

      <FormBuilder
        fields={fields}
        values={values}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel={isPending ? "Cancelling..." : "Confirm Cancellation"}
        isLoading={isPending}
      />
    </Modal>
  );
}
