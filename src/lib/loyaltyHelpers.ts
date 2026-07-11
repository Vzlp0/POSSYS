import { supabase } from './supabase';
import { LoyaltySettings, ClientLoyalty, MembershipTier } from '../types';

export async function calculateLoyaltyRewards(
  clientId: string,
  orderTotal: number,
  settings: LoyaltySettings
): Promise<{
  pointsEarned: number;
  cashbackEarned: number;
  tierDiscount: number;
}> {
  let pointsEarned = 0;
  let cashbackEarned = 0;
  let tierDiscount = 0;

  try {
    const { data: clientLoyalty } = await supabase
      .from('client_loyalty')
      .select('*, tier:membership_tiers(*)')
      .eq('client_id', clientId)
      .single();

    if (!clientLoyalty) {
      return { pointsEarned, cashbackEarned, tierDiscount };
    }

    if (settings.points_enabled) {
      const basePoints = Math.floor(orderTotal * settings.points_per_sar);
      const multiplier = clientLoyalty.tier?.points_multiplier || 1;
      pointsEarned = Math.floor(basePoints * multiplier);
    }

    if (settings.cashback_enabled) {
      cashbackEarned = (orderTotal * settings.cashback_percentage) / 100;
    }

    if (settings.tiers_enabled && clientLoyalty.tier) {
      tierDiscount = (orderTotal * clientLoyalty.tier.discount_percentage) / 100;
    }

    return { pointsEarned, cashbackEarned, tierDiscount };
  } catch (error) {
    console.error('Error calculating loyalty rewards:', error);
    return { pointsEarned, cashbackEarned, tierDiscount };
  }
}

export async function applyLoyaltyRewards(
  clientId: string,
  orderId: string,
  orderTotal: number,
  cashierName: string,
  settings: LoyaltySettings
): Promise<void> {
  try {
    const { pointsEarned, cashbackEarned } = await calculateLoyaltyRewards(clientId, orderTotal, settings);

    const { data: clientLoyalty } = await supabase
      .from('client_loyalty')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (!clientLoyalty) return;

    const updates: any = {};

    if (pointsEarned > 0) {
      updates.points_balance = clientLoyalty.points_balance + pointsEarned;
      updates.points_earned_total = clientLoyalty.points_earned_total + pointsEarned;

      await supabase.from('loyalty_transactions_history').insert({
        client_id: clientId,
        transaction_type: 'points_earned',
        order_id: orderId,
        points_change: pointsEarned,
        cashback_change: 0,
        amount: orderTotal,
        description: `Earned ${pointsEarned} points from purchase`,
        previous_balance: `${clientLoyalty.points_balance} points`,
        new_balance: `${updates.points_balance} points`,
        created_by: cashierName
      });
    }

    if (cashbackEarned > 0) {
      updates.cashback_balance = clientLoyalty.cashback_balance + cashbackEarned;
      updates.cashback_earned_total = clientLoyalty.cashback_earned_total + cashbackEarned;

      await supabase.from('loyalty_transactions_history').insert({
        client_id: clientId,
        transaction_type: 'cashback_earned',
        order_id: orderId,
        points_change: 0,
        cashback_change: cashbackEarned,
        amount: orderTotal,
        description: `Earned ${cashbackEarned.toFixed(2)} SAR cashback`,
        previous_balance: `${clientLoyalty.cashback_balance.toFixed(2)} SAR`,
        new_balance: `${updates.cashback_balance.toFixed(2)} SAR`,
        created_by: cashierName
      });
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('client_loyalty')
        .update(updates)
        .eq('client_id', clientId);
    }

    await checkTierUpgrade(clientId, settings);
  } catch (error) {
    console.error('Error applying loyalty rewards:', error);
  }
}

export async function redeemPoints(
  clientId: string,
  pointsToRedeem: number,
  orderId: string,
  cashierName: string,
  settings: LoyaltySettings
): Promise<number> {
  try {
    if (pointsToRedeem < settings.min_points_redemption) {
      throw new Error(`Minimum ${settings.min_points_redemption} points required`);
    }

    const { data: clientLoyalty } = await supabase
      .from('client_loyalty')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (!clientLoyalty || clientLoyalty.points_balance < pointsToRedeem) {
      throw new Error('Insufficient points');
    }

    const discountAmount = pointsToRedeem * settings.points_redemption_value;
    const newBalance = clientLoyalty.points_balance - pointsToRedeem;

    await supabase
      .from('client_loyalty')
      .update({
        points_balance: newBalance,
        points_redeemed_total: clientLoyalty.points_redeemed_total + pointsToRedeem
      })
      .eq('client_id', clientId);

    await supabase.from('loyalty_transactions_history').insert({
      client_id: clientId,
      transaction_type: 'points_redeemed',
      order_id: orderId,
      points_change: -pointsToRedeem,
      cashback_change: 0,
      amount: discountAmount,
      description: `Redeemed ${pointsToRedeem} points for ${discountAmount.toFixed(2)} SAR discount`,
      previous_balance: `${clientLoyalty.points_balance} points`,
      new_balance: `${newBalance} points`,
      created_by: cashierName
    });

    return discountAmount;
  } catch (error) {
    console.error('Error redeeming points:', error);
    throw error;
  }
}

export async function useCashback(
  clientId: string,
  amountToUse: number,
  orderId: string,
  cashierName: string
): Promise<number> {
  try {
    const { data: clientLoyalty } = await supabase
      .from('client_loyalty')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (!clientLoyalty || clientLoyalty.cashback_balance < amountToUse) {
      throw new Error('Insufficient cashback balance');
    }

    const newBalance = clientLoyalty.cashback_balance - amountToUse;

    await supabase
      .from('client_loyalty')
      .update({
        cashback_balance: newBalance,
        cashback_used_total: clientLoyalty.cashback_used_total + amountToUse
      })
      .eq('client_id', clientId);

    await supabase.from('loyalty_transactions_history').insert({
      client_id: clientId,
      transaction_type: 'cashback_used',
      order_id: orderId,
      points_change: 0,
      cashback_change: -amountToUse,
      amount: amountToUse,
      description: `Used ${amountToUse.toFixed(2)} SAR cashback`,
      previous_balance: `${clientLoyalty.cashback_balance.toFixed(2)} SAR`,
      new_balance: `${newBalance.toFixed(2)} SAR`,
      created_by: cashierName
    });

    return amountToUse;
  } catch (error) {
    console.error('Error using cashback:', error);
    throw error;
  }
}

async function checkTierUpgrade(clientId: string, settings: LoyaltySettings): Promise<void> {
  if (!settings.tiers_enabled) return;

  try {
    const { data: client } = await supabase
      .from('clients')
      .select('total_spent')
      .eq('id', clientId)
      .single();

    if (!client) return;

    const { data: tiers } = await supabase
      .from('membership_tiers')
      .select('*')
      .eq('is_active', true)
      .order('tier_level', { ascending: false });

    if (!tiers || tiers.length === 0) return;

    const eligibleTier = tiers.find(tier => client.total_spent >= tier.min_spending);

    if (!eligibleTier) return;

    const { data: clientLoyalty } = await supabase
      .from('client_loyalty')
      .select('tier_id')
      .eq('client_id', clientId)
      .single();

    if (clientLoyalty && clientLoyalty.tier_id !== eligibleTier.id) {
      await supabase
        .from('client_loyalty')
        .update({
          tier_id: eligibleTier.id,
          tier_since: new Date().toISOString()
        })
        .eq('client_id', clientId);

      await supabase.from('loyalty_transactions_history').insert({
        client_id: clientId,
        transaction_type: 'tier_upgrade',
        points_change: 0,
        cashback_change: 0,
        amount: 0,
        description: `Upgraded to ${eligibleTier.tier_name} tier`,
        created_by: 'System'
      });
    }
  } catch (error) {
    console.error('Error checking tier upgrade:', error);
  }
}

export async function checkSubscriptionValidity(clientId: string): Promise<boolean> {
  try {
    const { data: clientLoyalty } = await supabase
      .from('client_loyalty')
      .select('subscription_status, subscription_end')
      .eq('client_id', clientId)
      .single();

    if (!clientLoyalty || !clientLoyalty.subscription_end) {
      return false;
    }

    const now = new Date();
    const expiryDate = new Date(clientLoyalty.subscription_end);

    if (now > expiryDate && clientLoyalty.subscription_status === 'active') {
      await supabase
        .from('client_loyalty')
        .update({ subscription_status: 'expired' })
        .eq('client_id', clientId);
      return false;
    }

    return clientLoyalty.subscription_status === 'active';
  } catch (error) {
    console.error('Error checking subscription validity:', error);
    return false;
  }
}
