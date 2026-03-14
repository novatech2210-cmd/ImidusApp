'use client';

import React, { ReactNode } from 'react';

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | undefined;
  defaultValue?: any;
  disabled?: boolean;
  className?: string;
}

interface FormBuilderProps {
  fields: FormField[];
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (name: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isLoading?: boolean;
  children?: ReactNode;
}

export default function FormBuilder({
  fields,
  values,
  errors,
  onChange,
  onSubmit,
  submitLabel = 'Submit',
  isLoading = false,
  children,
}: FormBuilderProps) {
  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      value: values[field.name] ?? field.defaultValue ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        onChange(field.name, e.target.value);
      },
      disabled: isLoading || field.disabled,
      className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${field.className || ''}`,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            placeholder={field.placeholder}
            rows={4}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            {...commonProps}
            checked={!!values[field.name]}
            onChange={(e) => onChange(field.name, e.target.checked)}
            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            {...commonProps}
          />
        );

      default:
        return (
          <input
            type={field.type}
            {...commonProps}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {fields.map((field) => (
        <div key={field.name} className={field.type === 'checkbox' ? 'flex items-center gap-2' : ''}>
          {field.type === 'checkbox' ? (
            <>
              {renderField(field)}
              <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </>
          ) : (
            <>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </>
          )}
          {errors[field.name] && (
            <p className="text-sm text-red-600 mt-1">{errors[field.name]}</p>
          )}
        </div>
      ))}

      {children}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-orange-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : submitLabel}
      </button>
    </form>
  );
}
