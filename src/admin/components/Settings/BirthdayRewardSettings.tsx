'use client';

import React, { useState, useEffect } from 'react';
import { Gift, ToggleRight, AlertCircle } from 'lucide-react';
import Spinner from '@/components/Loading/Spinner';

interface BirthdayRewardConfig {
  rewardPoints: number;
  enabled: boolean;
  lastModified: string;
}

interface UpcomingBirthday {
  customerId: number;
  fName: string;
  lName: string;
  phone: string;
  email: string;
  birthDate: string;
  daysUntilBirthday: number;
}

export default function BirthdayRewardSettings() {
  const [config, setConfig] = useState<BirthdayRewardConfig | null>(null);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rewardPoints, setRewardPoints] = useState(500);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load configuration
      const configRes = await fetch('/api/admin/rewards/birthday-config');
      if (!configRes.ok) throw new Error('Failed to load configuration');
      const configData = await configRes.json();
      const cfg = configData.data;
      setConfig(cfg);
      setRewardPoints(cfg.rewardPoints || 500);
      setEnabled(cfg.enabled ?? true);

      // Load upcoming birthdays (next 7 days)
      const birthdaysRes = await fetch('/api/admin/rewards/upcoming-birthdays?days=7');
      if (!birthdaysRes.ok) throw new Error('Failed to load upcoming birthdays');
      const birthdaysData = await birthdaysRes.json();
      setUpcomingBirthdays(birthdaysData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/admin/rewards/configure-birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardPoints,
          enabled
        })
      });

      if (!res.ok) throw new Error('Failed to save configuration');

      setSuccess('Birthday reward settings updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-onyx-bg-secondary p-6 rounded-xl border border-onyx-border flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="bg-onyx-bg-secondary p-6 rounded-xl border border-onyx-border">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="text-onyx-gold" size={24} />
          <h3 className="text-lg font-semibold text-onyx-text-primary">Birthday Reward Settings</h3>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Points Configuration */}
          <div>
            <label className="block text-sm font-medium text-onyx-text-primary mb-2">
              Reward Points per Birthday
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="10"
                max="5000"
                step="10"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(Math.max(10, parseInt(e.target.value) || 500))}
                className="flex-1 px-4 py-2 bg-onyx-bg-tertiary border border-onyx-border rounded-lg text-onyx-text-primary placeholder-onyx-text-muted focus:ring-2 focus:ring-onyx-blue focus:border-transparent"
              />
              <span className="text-sm text-onyx-text-muted">points</span>
            </div>
            <p className="text-xs text-onyx-text-muted mt-1">
              Amount of loyalty points awarded on customer birthday
            </p>
          </div>

          {/* Enable/Disable Toggle */}
          <div>
            <label className="block text-sm font-medium text-onyx-text-primary mb-2">
              Feature Status
            </label>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                enabled
                  ? 'bg-onyx-gold/20 border border-onyx-gold'
                  : 'bg-onyx-bg-tertiary border border-onyx-border'
              }`}
            >
              <ToggleRight size={18} className={enabled ? 'text-onyx-gold' : 'text-onyx-text-muted'} />
              <span className={`font-medium ${enabled ? 'text-onyx-gold' : 'text-onyx-text-secondary'}`}>
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
            </button>
            <p className="text-xs text-onyx-text-muted mt-1">
              {enabled
                ? 'Birthday rewards will be processed daily at 2:00 AM UTC'
                : 'Birthday rewards processing is disabled'}
            </p>
          </div>

          {/* Last Modified */}
          {config?.lastModified && (
            <div className="pt-2 border-t border-onyx-border">
              <p className="text-xs text-onyx-text-muted">
                Last modified: {new Date(config.lastModified).toLocaleString()}
              </p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full mt-4 px-4 py-2 bg-onyx-gold text-onyx-bg-secondary font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Spinner size="sm" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>

      {/* Upcoming Birthdays Widget */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-onyx-bg-secondary p-6 rounded-xl border border-onyx-border">
          <h4 className="text-base font-semibold text-onyx-text-primary mb-4">
            Upcoming Birthdays (Next 7 Days)
          </h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {upcomingBirthdays.map((birthday) => (
              <div
                key={birthday.customerId}
                className="flex items-start justify-between p-3 bg-onyx-bg-tertiary rounded-lg border border-onyx-border hover:border-onyx-gold/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-onyx-text-primary">
                    {birthday.fName} {birthday.lName}
                  </p>
                  <p className="text-xs text-onyx-text-muted">
                    {birthday.phone} • {birthday.email}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <span className="text-sm font-semibold text-onyx-gold">
                    in {birthday.daysUntilBirthday} days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {upcomingBirthdays.length === 0 && !loading && (
        <div className="bg-onyx-bg-secondary p-6 rounded-xl border border-onyx-border text-center">
          <Gift size={32} className="text-onyx-text-muted mx-auto mb-2" />
          <p className="text-onyx-text-secondary">No upcoming birthdays in the next 7 days</p>
        </div>
      )}
    </div>
  );
}
