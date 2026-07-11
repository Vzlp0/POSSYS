import React, { useState, useEffect } from 'react';
import { Settings, Save, Star, DollarSign, Award, Calendar, Plus, CreditCard as Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { LoyaltySettings as LoyaltySettingsType, MembershipTier, SubscriptionPlan } from '../types';
import { supabase } from '../lib/supabase';

export default function LoyaltySettings() {
  const [settings, setSettings] = useState<LoyaltySettingsType | null>(null);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'points' | 'cashback' | 'tiers' | 'subscriptions'>('points');

  useEffect(() => {
    fetchSettings();
    fetchTiers();
    fetchPlans();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching loyalty settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .order('tier_level', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const updateSettings = async (updates: Partial<LoyaltySettingsType>) => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('loyalty_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loyalty System Settings</h1>
          <p className="text-gray-600 mt-1">Configure your loyalty programs and rewards</p>
        </div>
        <Settings className="w-8 h-8 text-gray-400" />
      </div>

      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('points')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'points'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-100'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Points System</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('cashback')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'cashback'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-100'
          }`}
        >
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Cashback System</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('tiers')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'tiers'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-100'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Membership Tiers</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'subscriptions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-100'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Subscriptions</span>
          </div>
        </button>
      </div>

      {activeTab === 'points' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Points System</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customers earn points on purchases and redeem them for discounts</p>
            </div>
            <button
              onClick={() => updateSettings({ points_enabled: !settings.points_enabled })}
              className="flex items-center space-x-2"
            >
              {settings.points_enabled ? (
                <ToggleRight className="w-12 h-12 text-green-600" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-400" />
              )}
            </button>
          </div>

          {settings.points_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points per 1 SAR
                </label>
                <input
                  type="number"
                  value={settings.points_per_sar}
                  onChange={(e) => setSettings({ ...settings, points_per_sar: parseFloat(e.target.value) })}
                  onBlur={() => updateSettings({ points_per_sar: settings.points_per_sar })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Example: 1 SAR = {settings.points_per_sar} points</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Point Value (SAR)
                </label>
                <input
                  type="number"
                  value={settings.points_redemption_value}
                  onChange={(e) => setSettings({ ...settings, points_redemption_value: parseFloat(e.target.value) })}
                  onBlur={() => updateSettings({ points_redemption_value: settings.points_redemption_value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">1 point = {settings.points_redemption_value} SAR discount</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Points to Redeem
                </label>
                <input
                  type="number"
                  value={settings.min_points_redemption}
                  onChange={(e) => setSettings({ ...settings, min_points_redemption: parseInt(e.target.value) })}
                  onBlur={() => updateSettings({ min_points_redemption: settings.min_points_redemption })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum: {settings.min_points_redemption} points</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cashback' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cashback System</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Return a percentage of purchases as store credit</p>
            </div>
            <button
              onClick={() => updateSettings({ cashback_enabled: !settings.cashback_enabled })}
              className="flex items-center space-x-2"
            >
              {settings.cashback_enabled ? (
                <ToggleRight className="w-12 h-12 text-green-600" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-400" />
              )}
            </button>
          </div>

          {settings.cashback_enabled && (
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cashback Percentage
              </label>
              <input
                type="number"
                value={settings.cashback_percentage}
                onChange={(e) => setSettings({ ...settings, cashback_percentage: parseFloat(e.target.value) })}
                onBlur={() => updateSettings({ cashback_percentage: settings.cashback_percentage })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.1"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Customers earn {settings.cashback_percentage}% of their purchase as store credit
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tiers' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Membership Tiers</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reward customers based on their spending levels</p>
            </div>
            <button
              onClick={() => updateSettings({ tiers_enabled: !settings.tiers_enabled })}
              className="flex items-center space-x-2"
            >
              {settings.tiers_enabled ? (
                <ToggleRight className="w-12 h-12 text-green-600" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-400" />
              )}
            </button>
          </div>

          {settings.tiers_enabled && (
            <div className="space-y-4">
              {tiers.map((tier) => (
                <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tier.tier_color + '20' }}
                      >
                        <Award className="w-6 h-6" style={{ color: tier.tier_color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{tier.tier_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Minimum Spending: {tier.min_spending} SAR
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{tier.discount_percentage}% Discount</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{tier.points_multiplier}x Points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Subscription Plans</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Offer monthly or yearly membership plans</p>
            </div>
            <button
              onClick={() => updateSettings({ subscription_enabled: !settings.subscription_enabled })}
              className="flex items-center space-x-2"
            >
              {settings.subscription_enabled ? (
                <ToggleRight className="w-12 h-12 text-green-600" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-400" />
              )}
            </button>
          </div>

          {settings.subscription_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="border-2 border-gray-200 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.plan_name}</h3>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                      <span className="text-gray-600 ml-2">SAR/{plan.duration_type === 'monthly' ? 'month' : 'year'}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {plan.benefits.free_items && (
                      <p>• {plan.benefits.free_items} free items per {plan.duration_type === 'monthly' ? 'month' : 'year'}</p>
                    )}
                    {plan.benefits.discount && (
                      <p>• {plan.benefits.discount}% discount on all purchases</p>
                    )}
                    {plan.benefits.priority_support && <p>• Priority customer support</p>}
                    {plan.benefits.birthday_bonus && <p>• {plan.benefits.birthday_bonus} bonus points on birthday</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
