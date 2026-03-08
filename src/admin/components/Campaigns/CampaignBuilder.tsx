'use client';

import React, { useState } from 'react';
import Modal from '@/components/Dialogs/Modal';
import FormBuilder, { FormField } from '@/components/Forms/FormBuilder';
import { useCreateCampaign } from '@/lib/hooks';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface CampaignBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'details' | 'audience' | 'content' | 'schedule' | 'review';

export default function CampaignBuilder({ isOpen, onClose, onSuccess }: CampaignBuilderProps) {
  const [step, setStep] = useState<Step>('details');
  const [values, setValues] = useState<Record<string, any>>({
    name: '',
    type: 'email',
    segment: 'all',
    subject: '',
    content: '',
    scheduleType: 'now',
    scheduledDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: createCampaign, isPending } = useCreateCampaign();

  const steps: Step[] = ['details', 'audience', 'content', 'schedule', 'review'];
  const stepIndex = steps.indexOf(step);

  const fieldsMap: Record<Step, FormField[]> = {
    details: [
      {
        name: 'name',
        label: 'Campaign Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Summer Promotion 2024',
      },
      {
        name: 'type',
        label: 'Campaign Type',
        type: 'select',
        required: true,
        options: [
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' },
          { value: 'push', label: 'Push Notification' },
        ],
      },
    ],
    audience: [
      {
        name: 'segment',
        label: 'Target Segment',
        type: 'select',
        required: true,
        options: [
          { value: 'all', label: 'All Customers' },
          { value: 'vip', label: 'VIP Customers' },
          { value: 'regular', label: 'Regular Customers' },
          { value: 'at_risk', label: 'At Risk Customers' },
          { value: 'new', label: 'New Customers' },
        ],
      },
    ],
    content: [
      {
        name: 'subject',
        label: 'Subject / Title',
        type: 'text',
        required: true,
        placeholder: 'Email subject or notification title',
      },
      {
        name: 'content',
        label: 'Message Content',
        type: 'textarea',
        required: true,
        placeholder: 'Write your campaign message here...',
      },
    ],
    schedule: [
      {
        name: 'scheduleType',
        label: 'When to Send',
        type: 'select',
        required: true,
        options: [
          { value: 'now', label: 'Send Now' },
          { value: 'schedule', label: 'Schedule for Later' },
        ],
      },
      {
        name: 'scheduledDate',
        label: 'Scheduled Date & Time',
        type: 'date',
        required: values.scheduleType === 'schedule',
        disabled: values.scheduleType !== 'schedule',
      },
    ],
    review: [],
  };

  const currentFields = fieldsMap[step];

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleNext = () => {
    // Validate current step
    const newErrors: Record<string, string> = {};
    currentFields.forEach((field) => {
      if (field.required && !values[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const nextIdx = stepIndex + 1;
    if (nextIdx < steps.length) {
      setStep(steps[nextIdx]);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStep(steps[stepIndex - 1]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createCampaign(values, {
      onSuccess: () => {
        setValues({
          name: '',
          type: 'email',
          segment: 'all',
          subject: '',
          content: '',
          scheduleType: 'now',
          scheduledDate: '',
        });
        setErrors({});
        onClose();
        onSuccess?.();
      },
      onError: (error: any) => {
        setErrors({ submit: error?.message || 'Failed to create campaign' });
      },
    });
  };

  const getStepTitle = () => {
    const titles: Record<Step, string> = {
      details: 'Campaign Details',
      audience: 'Target Audience',
      content: 'Message Content',
      schedule: 'Schedule',
      review: 'Review & Send',
    };
    return titles[step];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Campaign" size="lg">
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => i <= stepIndex && setStep(s)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i === stepIndex
                    ? 'bg-orange-500 text-white'
                    : i < stepIndex
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {i < stepIndex ? '✓' : i + 1}
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${i < stepIndex ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Title */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{getStepTitle()}</h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 'review' ? (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase">Campaign Name</p>
                <p className="text-sm font-medium text-gray-900">{values.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <p className="text-sm font-medium text-gray-900">{values.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Audience</p>
                <p className="text-sm font-medium text-gray-900">{values.segment}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Subject</p>
                <p className="text-sm font-medium text-gray-900">{values.subject}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Content</p>
                <p className="text-sm text-gray-600 line-clamp-3">{values.content}</p>
              </div>
            </div>
          ) : (
            <FormBuilder
              fields={currentFields}
              values={values}
              errors={errors}
              onChange={handleChange}
              onSubmit={handleNext}
              submitLabel={stepIndex === steps.length - 1 ? 'Create Campaign' : 'Next'}
              isLoading={isPending}
            >
              {/* Replace form buttons */}
            </FormBuilder>
          )}

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded text-sm">
              {errors.submit}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {step === 'review' ? (
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-orange-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Creating...' : 'Create & Send'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}
