import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Award,
  Calendar,
  Download
} from 'lucide-react';
import { ClientLoyalty, Client, MembershipTier } from '../types';
import { supabase } from '../lib/supabase';

interface ClientWithLoyalty extends Client {
  client_loyalty?: ClientLoyalty;
}

export default function LoyaltyReports() {
  const [topClients, setTopClients] = useState<ClientWithLoyalty[]>([]);
  const [stats, setStats] = useState({
    total_points_issued: 0,
    total_points_redeemed: 0,
    total_cashback_issued: 0,
    total_cashback_used: 0,
    active_subscriptions: 0,
    tier_distribution: {} as Record<string, number>
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*, client_loyalty(*)')
        .eq('status', 'active')
        .order('total_spent', { ascending: false })
        .limit(10);

      if (clientsError) throw clientsError;

      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('client_loyalty')
        .select('*');

      if (loyaltyError) throw loyaltyError;

      const totalPointsIssued = loyaltyData?.reduce((sum, l) => sum + l.points_earned_total, 0) || 0;
      const totalPointsRedeemed = loyaltyData?.reduce((sum, l) => sum + l.points_redeemed_total, 0) || 0;
      const totalCashbackIssued = loyaltyData?.reduce((sum, l) => sum + l.cashback_earned_total, 0) || 0;
      const totalCashbackUsed = loyaltyData?.reduce((sum, l) => sum + l.cashback_used_total, 0) || 0;
      const activeSubscriptions = loyaltyData?.filter(l => l.subscription_status === 'active').length || 0;

      const { data: tiersData } = await supabase
        .from('membership_tiers')
        .select('id, tier_name');

      const tierDistribution: Record<string, number> = {};
      tiersData?.forEach(tier => {
        const count = loyaltyData?.filter(l => l.tier_id === tier.id).length || 0;
        tierDistribution[tier.tier_name] = count;
      });

      setTopClients(clientsData as ClientWithLoyalty[] || []);
      setStats({
        total_points_issued: totalPointsIssued,
        total_points_redeemed: totalPointsRedeemed,
        total_cashback_issued: totalCashbackIssued,
        total_cashback_used: totalCashbackUsed,
        active_subscriptions: activeSubscriptions,
        tier_distribution: tierDistribution
      });
    } catch (error) {
      console.error('Error fetching loyalty reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loyalty Reports</h1>
          <p className="text-gray-600 mt-1">Track loyalty program performance and top customers</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Export Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Points Issued</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_points_issued.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cashback Issued</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.total_cashback_issued)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active_subscriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Points Redeemed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_points_redeemed.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tier Distribution</h2>
          <div className="space-y-4">
            {Object.entries(stats.tier_distribution).map(([tierName, count]) => (
              <div key={tierName}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tierName}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{count} customers</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(count / topClients.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top 10 Loyal Customers</h2>
          <div className="space-y-3">
            {topClients.map((client, index) => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {client.first_name} {client.last_name}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                      {client.client_loyalty && (
                        <>
                          {client.client_loyalty.points_balance > 0 && (
                            <span>{client.client_loyalty.points_balance} pts</span>
                          )}
                          {client.client_loyalty.cashback_balance > 0 && (
                            <span>{formatCurrency(client.client_loyalty.cashback_balance)} cashback</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(client.total_spent)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{client.total_visits} visits</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
