'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ruleSchema } from '@/lib/rule-validation';

interface RuleBuilderProps {
  onSave?: (rule: any) => void;
  onCancel?: () => void;
  initialRule?: any;
  templates?: any[];
}

export default function RuleBuilder({ 
  onSave, 
  onCancel, 
  initialRule,
  templates 
}: RuleBuilderProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: initialRule || {
      name: '',
      description: '',
      priority: 50,
      active: true,
      conditions: {
        if_cart_contains: {},
        and_cart_missing: {},
        if_cart_total: {}
      },
      suggestions: [],
      constraints: {}
    }
  });

  const { fields: suggestionFields, append: appendSuggestion, remove: removeSuggestion } = useFieldArray({
    control,
    name: 'suggestions'
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/pos?action=categories');
        const cats = await res.json();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Load templates if provided
  useEffect(() => {
    if (templates && templates.length > 0 && !initialRule) {
      // Auto-select first template
      handleTemplateChange(templates[0].id);
    }
  }, [templates, initialRule]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templates) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        const templateData = JSON.parse(template.template_json);
        // Apply template to form
        Object.keys(templateData).forEach(key => {
          setValue(key as any, templateData[key]);
        });
      }
    }
  };

  const handleSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/pos?action=search&search=${encodeURIComponent(searchTerm)}&limit=10`);
      const results = await res.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching items:', error);
    }
  };

  const onSubmit = (data: any) => {
    if (onSave) {
      onSave(data);
    }
  };

  return (
    <div className="rule-builder p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Rule Builder</h2>
      
      {/* Template Selector */}
      {templates && templates.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Load Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a template...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Rule Name & Description */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Rule Name *
          </label>
          <input
            type="text"
            {...register('name')}
            className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`}
            placeholder="e.g., Burger to Fries Upsell"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            className="w-full p-2 border rounded"
            rows={2}
            placeholder="Describe what this rule does..."
          />
        </div>

        {/* Priority Slider */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Priority: {watch('priority')}
          </label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <input
                type="range"
                min="0"
                max="100"
                {...field}
                className="w-full"
              />
            )}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Low (0)</span>
            <span>High (100)</span>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('active')}
            className="mr-2"
          />
          <label className="text-sm font-medium">Active</label>
        </div>

        {/* Conditions Builder */}
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-3">Conditions</h3>
          
          {/* IF Cart Contains */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              IF cart contains
            </label>
            <div className="flex gap-2">
              <Controller
                name="conditions.if_cart_contains.item_id"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    {...field}
                    placeholder="Item ID (UUID)"
                    className="flex-1 p-2 border rounded"
                  />
                )}
              />
              <Controller
                name="conditions.if_cart_contains.item_category"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="p-2 border rounded"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          {/* AND Cart Missing (Optional) */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              AND cart missing (optional)
            </label>
            <div className="flex gap-2">
              <Controller
                name="conditions.and_cart_missing.item_id"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    {...field}
                    placeholder="Item ID (UUID)"
                    className="flex-1 p-2 border rounded"
                  />
                )}
              />
              <Controller
                name="conditions.and_cart_missing.item_category"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="p-2 border rounded"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          {/* IF Cart Total */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              IF cart total
            </label>
            <div className="flex gap-2 items-center">
              <span>$</span>
              <Controller
                name="conditions.if_cart_total.min"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    step="0.01"
                    {...field}
                    placeholder="Min"
                    className="w-24 p-2 border rounded"
                  />
                )}
              />
              <span>to $</span>
              <Controller
                name="conditions.if_cart_total.max"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    step="0.01"
                    {...field}
                    placeholder="Max"
                    className="w-24 p-2 border rounded"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Suggestions Builder */}
        <div className="border p-4 rounded">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Suggestions</h3>
            <button
              type="button"
              onClick={() => appendSuggestion({ pos_item_id: '', discount_percent: 0, message: '' })}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              + Add Suggestion
            </button>
          </div>

          {suggestionFields.map((field, index) => (
            <div key={field.id} className="mb-3 p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Suggestion {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSuggestion(index)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
              
              <div className="flex gap-2 mb-2">
                <Controller
                  name={`suggestions.${index}.pos_item_id`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      {...field}
                      placeholder="POS Item ID"
                      className="flex-1 p-2 border rounded"
                    />
                  )}
                />
                <Controller
                  name={`suggestions.${index}.discount_percent`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      {...field}
                      placeholder="% Off"
                      className="w-20 p-2 border rounded"
                    />
                  )}
                />
              </div>
              
              <Controller
                name={`suggestions.${index}.message`}
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    {...field}
                    placeholder="Custom message (optional)"
                    className="w-full p-2 border rounded"
                  />
                )}
              />
            </div>
          ))}

          {suggestionFields.length === 0 && (
            <p className="text-gray-500 text-sm">
              No suggestions added. Click "Add Suggestion" to start.
            </p>
          )}
        </div>

        {/* Constraints (Optional) */}
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-3">Constraints (Optional)</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Cart Value
              </label>
              <Controller
                name="constraints.min_cart_value"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    step="0.01"
                    {...field}
                    placeholder="$0.00"
                    className="w-full p-2 border rounded"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Cart Value
              </label>
              <Controller
                name="constraints.max_cart_value"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    step="0.01"
                    {...field}
                    placeholder="$999.99"
                    className="w-full p-2 border rounded"
                  />
                )}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Time of Day
            </label>
            <div className="flex gap-4">
              {['breakfast', 'lunch', 'dinner'].map((time) => (
                <label key={time} className="flex items-center">
                  <input
                    type="checkbox"
                    {...register(`constraints.time_of_day.${time}`)}
                    className="mr-1"
                  />
                  <span className="capitalize">{time}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Days of Week
            </label>
            <div className="flex flex-wrap gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    {...register(`constraints.days_of_week.${day}`)}
                    className="mr-1"
                  />
                  <span className="capitalize text-sm">{day.substring(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="border p-4 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">JSON Preview</h3>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(watch(), null, 2)}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Rule
          </button>
        </div>
      </form>
    </div>
  );
}
