import React from 'react';
import { Coffee, CheckCircle, Circle, Gift } from 'lucide-react';

interface LoyaltyCardProps {
  current_stamps: number;
  stamps_required: number;
  completed_cards: number;
  size?: 'small' | 'medium' | 'large';
  showReward?: boolean;
}

export default function LoyaltyCard({
  current_stamps,
  stamps_required,
  completed_cards,
  size = 'medium',
  showReward = true
}: LoyaltyCardProps) {
  const sizeClasses = {
    small: { card: 'p-3', icon: 'w-6 h-6', text: 'text-xs' },
    medium: { card: 'p-6', icon: 'w-10 h-10', text: 'text-sm' },
    large: { card: 'p-8', icon: 'w-12 h-12', text: 'text-base' }
  };

  const { card: cardClass, icon: iconSize, text: textSize } = sizeClasses[size];

  const renderStamp = (index: number) => {
    const isStamped = index < current_stamps;

    return (
      <div key={index} className="flex flex-col items-center">
        <div
          className={`rounded-full flex items-center justify-center transition-all ${
            isStamped
              ? 'bg-amber-600 text-white'
              : 'bg-gray-100 text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-600'
          } ${iconSize === 'w-6 h-6' ? 'w-8 h-8' : iconSize === 'w-10 h-10' ? 'w-12 h-12' : 'w-16 h-16'}`}
        >
          {isStamped ? (
            <CheckCircle className={iconSize} />
          ) : (
            <Circle className={iconSize} />
          )}
        </div>
        <span className={`mt-1 font-medium ${isStamped ? 'text-amber-600' : 'text-gray-400'} ${textSize}`}>
          {index + 1}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl ${cardClass}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Coffee className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Coffee Loyalty</h3>
              <p className={`text-amber-600 ${textSize}`}>
                {current_stamps} of {stamps_required} stamps
              </p>
            </div>
          </div>
          {completed_cards > 0 && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              <span className="text-xs font-bold">{completed_cards} Free Coffee{completed_cards > 1 ? 's' : ''} Earned</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {Array.from({ length: stamps_required }).map((_, index) => renderStamp(index))}
        </div>

        {showReward && (
          <div className="border-t-2 border-dashed border-amber-200 pt-4 mt-4">
            <div className="flex items-center justify-center space-x-2 text-amber-700">
              <Gift className="w-5 h-5" />
              <span className="font-semibold">Reward: Free Coffee</span>
            </div>
          </div>
        )}
      </div>

      {current_stamps >= stamps_required && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-green-800 text-lg">Reward Ready!</h4>
            <p className="text-green-700 text-sm mt-1">
              Claim your free coffee on your next visit
            </p>
          </div>
        </div>
      )}

      {current_stamps > 0 && current_stamps < stamps_required && (
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Just <span className="font-bold text-amber-600">{stamps_required - current_stamps} more</span> coffee{stamps_required - current_stamps > 1 ? 's' : ''} until your next free one!
          </p>
        </div>
      )}
    </div>
  );
}
