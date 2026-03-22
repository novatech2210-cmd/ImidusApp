'use client';

import { useState } from 'react';
import { useMenuOverrides, useUpdateMenuOverride } from '@/lib/hooks';
import MainLayout from '@/components/Navigation/MainLayout';
import DataTable from '@/components/Tables/DataTable';
import Modal from '@/components/Dialogs/Modal';
import Spinner from '@/components/Loading/Spinner';
import { AlertCircle, CheckCircle, ToggleLeft, ToggleRight, UtensilsCrossed, Database, DollarSign } from 'lucide-react';
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#FF6B6B]/10 rounded-xl">
              <UtensilsCrossed size={24} className="text-[#FF6B6B]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F5F5F7]">Menu Management</h1>
              <p className="text-sm text-[#6E6E78]">Enable/disable items and manage overlay pricing</p>
            </div>
          </div>

          {/* Note about overlay */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#5BA0FF]/10 rounded-full border border-[#5BA0FF]/30">
            <Database size={14} className="text-[#5BA0FF]" />
            <span className="text-xs font-medium text-[#5BA0FF]">Overlay Mode • No POS Changes</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0" />
            <p className="text-sm text-[#FF6B6B]">Failed to load menu overrides. Please try again.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1A1A1F] p-6 rounded-xl border border-[#2A2A30]">
            <p className="text-xs text-[#6E6E78] uppercase tracking-wider mb-2">Total Items</p>
            <p className="text-3xl font-bold text-[#F5F5F7]">{overrides?.length || 0}</p>
          </div>
          <div className="bg-[#1A1A1F] p-6 rounded-xl border border-[#2A2A30]">
            <p className="text-xs text-[#6E6E78] uppercase tracking-wider mb-2">Available</p>
            <p className="text-3xl font-bold text-[#4ADE80]">
              {overrides?.filter((i: any) => i.isAvailable).length || 0}
            </p>
          </div>
          <div className="bg-[#1A1A1F] p-6 rounded-xl border border-[#2A2A30]">
            <p className="text-xs text-[#6E6E78] uppercase tracking-wider mb-2">Disabled</p>
            <p className="text-3xl font-bold text-[#FF6B6B]">
              {overrides?.filter((i: any) => !i.isAvailable).length || 0}
            </p>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="bg-[#1A1A1F] rounded-xl border border-[#2A2A30] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2A30]">
            <h2 className="text-lg font-semibold text-[#F5F5F7]">Menu Items</h2>
            <p className="text-xs text-[#6E6E78]">Items from tblItem • Prices from tblAvailableSize</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#222228] border-b border-[#2A2A30]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6E6E78] uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6E6E78] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6E6E78] uppercase tracking-wider">Display Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6E6E78] uppercase tracking-wider">Stock (On Hand)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6E6E78] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6E6E78] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {overrides?.map((item: any) => (
                  <tr key={item.itemId} className="border-b border-[#2A2A30]/50 hover:bg-[#222228] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#F5F5F7]">{item.itemName}</td>
                    <td className="px-6 py-4 text-sm text-[#9A9AA3]">{item.category || '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#FFD666]">{formatCurrency(item.displayPrice)}</td>
                    <td className="px-6 py-4 text-sm text-[#9A9AA3]">{item.stock || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          item.isAvailable
                            ? 'bg-[#4ADE80]/20 text-[#4ADE80]'
                            : 'bg-[#FF6B6B]/20 text-[#FF6B6B]'
                        }`}
                      >
                        {item.isAvailable ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {item.isAvailable ? 'Available' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.isAvailable
                            ? 'text-[#4ADE80] hover:bg-[#4ADE80]/10'
                            : 'text-[#FF6B6B] hover:bg-[#FF6B6B]/10'
                        }`}
                        disabled={updateOverride.isPending}
                      >
                        {item.isAvailable ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1.5 text-xs font-medium bg-[#5BA0FF]/10 text-[#5BA0FF] rounded-lg hover:bg-[#5BA0FF]/20 transition-colors"
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
            <div className="p-6 bg-[#1A1A1F]">
              <h3 className="text-lg font-semibold text-[#F5F5F7] mb-6">
                Edit: {selectedItem.itemName}
              </h3>

              <div className="space-y-4">
                {/* Display Price */}
                <div>
                  <label className="block text-xs font-medium text-[#6E6E78] uppercase tracking-wider mb-2">
                    Display Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6E78]">
                      <DollarSign size={16} />
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
                      className="w-full pl-10 pr-4 py-3 bg-[#222228] border border-[#2A2A30] rounded-xl text-[#F5F5F7] focus:outline-none focus:border-[#5BA0FF] transition-colors"
                    />
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#222228] border border-[#2A2A30] rounded-xl">
                  <label className="text-sm font-medium text-[#F5F5F7]">
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
                    <div className="w-11 h-6 bg-[#2A2A30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#6E6E78] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ADE80] peer-checked:after:bg-white"></div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-[#2A2A30]">
                <button
                  onClick={() => setEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#2A2A30] text-[#9A9AA3] rounded-xl hover:bg-[#222228] hover:text-[#F5F5F7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateOverride.isPending}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#5BA0FF] to-[#3D82E0] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
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
