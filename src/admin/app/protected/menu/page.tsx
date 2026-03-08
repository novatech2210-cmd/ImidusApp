'use client';

import { useState } from 'react';
import { useMenuOverrides, useUpdateMenuOverride } from '@/lib/hooks';
import MainLayout from '@/components/Navigation/MainLayout';
import DataTable from '@/components/Tables/DataTable';
import Modal from '@/components/Dialogs/Modal';
import Spinner from '@/components/Loading/Spinner';
import { AlertCircle, CheckCircle, ToggleLeft, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function MenuPage() {
  const { data: overrides, isLoading, error } = useMenuOverrides();
  const updateOverride = useUpdateMenuOverride(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editModal, setEditModal] = useState(false);
  const [formData, setFormData] = useState({
    displayPrice: 0,
    isAvailable: true,
  });

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({
      displayPrice: item.displayPrice,
      isAvailable: item.isAvailable,
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    updateOverride.mutate(
      { itemId: selectedItem.itemId, data: formData },
      {
        onSuccess: () => {
          setEditModal(false);
          setSelectedItem(null);
        },
      }
    );
  };

  const handleToggleAvailability = (item: any) => {
    updateOverride.mutate(
      { itemId: item.itemId, data: { isAvailable: !item.isAvailable } },
      {}
    );
  };

  if (isLoading) return <Spinner fullScreen />;

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Enable/disable items and manage overlay pricing</p>
        </div>

        {error && (
          <div className="alert alert-danger mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Failed to load menu overrides. Please try again.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Total Items</p>
            <p className="text-3xl font-bold text-gray-900">{overrides?.length || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Available</p>
            <p className="text-3xl font-bold text-green-600">
              {overrides?.filter((i: any) => i.isAvailable).length || 0}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Disabled</p>
            <p className="text-3xl font-bold text-red-600">
              {overrides?.filter((i: any) => !i.isAvailable).length || 0}
            </p>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Menu Items</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Display Price</th>
                  <th>Stock (On Hand)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overrides?.map((item: any) => (
                  <tr key={item.itemId}>
                    <td className="font-medium">{item.itemName}</td>
                    <td>{item.category || '—'}</td>
                    <td>{formatCurrency(item.displayPrice)}</td>
                    <td>{item.stock || '—'}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.isAvailable ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {item.isAvailable ? '✓ Available' : '✗ Disabled'}
                      </span>
                    </td>
                    <td className="space-x-2">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className="btn btn-sm btn-secondary"
                        disabled={updateOverride.isPending}
                      >
                        <ToggleLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn btn-sm btn-primary"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editModal && selectedItem && (
          <Modal isOpen={editModal} title={`Edit: ${selectedItem.itemName}`} size="md" onClose={() => setEditModal(false)}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit: {selectedItem.itemName}
              </h3>

              <div className="space-y-4">
                {/* Display Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.displayPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="pl-8 w-full"
                    />
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">
                    Available for Order
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) =>
                        setFormData({ ...formData, isAvailable: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setEditModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateOverride.isPending}
                  className="btn btn-primary flex-1"
                >
                  {updateOverride.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </MainLayout>
  );
}
