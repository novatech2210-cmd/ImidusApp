'use client';

import React, { useState, useEffect } from 'react';
import RuleBuilder from '@/components/admin/RuleBuilder';
import RuleTester from '@/components/admin/RuleTester';

interface UpsellRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  active: boolean;
  conditions: any;
  suggestions: any[];
  constraints?: any;
  created_at: string;
  updated_at: string;
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  template_json: string;
  category: string;
}

export default function UpsellRulesPage() {
  const [rules, setRules] = useState<UpsellRule[]>([]);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showTester, setShowTester] = useState(false);
  const [editingRule, setEditingRule] = useState<UpsellRule | null>(null);
  const [selectedRule, setSelectedRule] = useState<UpsellRule | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load rules and templates
  useEffect(() => {
    loadRules();
    loadTemplates();
  }, [page, filterStatus, searchTerm]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filterStatus !== 'all' && { active: filterStatus === 'active' ? 'true' : 'false' }),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/admin/upsell-rules?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRules(data.data);
        setTotalPages(data.pagination.pages);
      } else {
        setError(data.error || 'Failed to load rules');
      }
    } catch (err) {
      setError('Failed to load rules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/upsell-rules/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleSaveRule = async (ruleData: any) => {
    try {
      const url = editingRule 
        ? `/api/admin/upsell-rules/${editingRule.id}`
        : '/api/admin/upsell-rules';
      
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowBuilder(false);
        setEditingRule(null);
        loadRules();
      } else {
        setError(data.error || 'Failed to save rule');
      }
    } catch (err) {
      setError('Failed to save rule');
      console.error(err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const response = await fetch(`/api/admin/upsell-rules/${ruleId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadRules();
      } else {
        setError(data.error || 'Failed to delete rule');
      }
    } catch (err) {
      setError('Failed to delete rule');
      console.error(err);
    }
  };

  const handleEditRule = (rule: UpsellRule) => {
    setEditingRule(rule);
    setShowBuilder(true);
  };

  const handleDuplicateRule = async (rule: UpsellRule) => {
    const { id, created_at, updated_at, ...rest } = rule;
    const duplicateData = {
      ...rest,
      name: `${rule.name} (Copy)`,
      active: false
    };
    
    try {
      const response = await fetch('/api/admin/upsell-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadRules();
      } else {
        setError(data.error || 'Failed to duplicate rule');
      }
    } catch (err) {
      setError('Failed to duplicate rule');
      console.error(err);
    }
  };

  const toggleRuleStatus = async (rule: UpsellRule) => {
    try {
      const response = await fetch(`/api/admin/upsell-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !rule.active })
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadRules();
      } else {
        setError(data.error || 'Failed to update rule status');
      }
    } catch (err) {
      setError('Failed to update rule status');
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Upselling Rules</h1>
          <p className="text-gray-600">Manage your upselling rules and promotions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTester(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Rules
          </button>
          <button
            onClick={() => {
              setEditingRule(null);
              setShowBuilder(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Create New Rule
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
          <button onClick={() => setError(null)} className="float-right">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search rules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Rules Table */}
      {loading ? (
        <div className="text-center py-8">Loading rules...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No rules found. Create your first upselling rule!
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conditions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggestions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{rule.name}</div>
                    {rule.description && (
                      <div className="text-sm text-gray-500">{rule.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded bg-gray-100">
                      {rule.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRuleStatus(rule)}
                      className={`px-2 py-1 text-xs rounded ${
                        rule.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {rule.conditions?.if_cart_contains?.item_id && (
                      <div>Item: {rule.conditions.if_cart_contains.item_id.substring(0, 8)}...</div>
                    )}
                    {rule.conditions?.if_cart_contains?.item_category && (
                      <div>Category: {rule.conditions.if_cart_contains.item_category}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {rule.suggestions.length} suggestion(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicateRule(rule)}
                      className="text-gray-600 hover:text-gray-900 mr-3"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Rule Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingRule ? 'Edit Rule' : 'Create New Rule'}
              </h2>
              <button
                onClick={() => {
                  setShowBuilder(false);
                  setEditingRule(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <RuleBuilder
              onSave={handleSaveRule}
              onCancel={() => {
                setShowBuilder(false);
                setEditingRule(null);
              }}
              initialRule={editingRule || undefined}
              templates={templates}
            />
          </div>
        </div>
      )}

      {/* Rule Tester Modal */}
      {showTester && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Test Upselling Rules</h2>
              <button
                onClick={() => setShowTester(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <RuleTester
              rules={rules}
              onClose={() => setShowTester(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
