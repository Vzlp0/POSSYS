export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Waiting Manager Approval';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
      return 'Cancelled by Manager';
    case 'revision_required':
      return 'Need Changes';
    case 'draft':
      return 'Draft';
    default:
      return status;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'approved':
      return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
    case 'rejected':
      return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    case 'cancelled':
      return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    case 'pending':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
    case 'revision_required':
      return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
    case 'draft':
      return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    default:
      return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
  }
};

export const getActionLabel = (action: string): string => {
  switch (action) {
    case 'created':
      return 'Created PR';
    case 'updated':
      return 'Updated PR';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
      return 'Cancelled';
    case 'revision_requested':
      return 'Requested Changes';
    case 'resubmitted':
      return 'Resubmitted';
    default:
      return action;
  }
};

export const getActionIcon = (action: string): string => {
  switch (action) {
    case 'created':
      return '🆕';
    case 'updated':
      return '✏️';
    case 'approved':
      return '✅';
    case 'rejected':
      return '❌';
    case 'cancelled':
      return '🚫';
    case 'revision_requested':
      return '🔄';
    case 'resubmitted':
      return '📤';
    default:
      return '📋';
  }
};

export const calculateFinalPrice = (
  basePrice: number,
  vatType: 'INC' | 'EXC',
  vatRate: number,
  discountType: 'none' | 'percentage' | 'fixed',
  discountValue: number
): { basePrice: number; vatAmount: number; discountAmount: number; finalPrice: number } => {
  let priceBeforeDiscount = basePrice;
  let vatAmount = 0;

  if (vatType === 'EXC') {
    vatAmount = basePrice * (vatRate / 100);
    priceBeforeDiscount = basePrice + vatAmount;
  } else {
    vatAmount = basePrice * (vatRate / (100 + vatRate));
  }

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = priceBeforeDiscount * (discountValue / 100);
  } else if (discountType === 'fixed') {
    discountAmount = discountValue;
  }

  const finalPrice = priceBeforeDiscount - discountAmount;

  return {
    basePrice,
    vatAmount,
    discountAmount,
    finalPrice
  };
};
