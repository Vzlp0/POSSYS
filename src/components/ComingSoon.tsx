import React from 'react';
import { Construction } from 'lucide-react';
import POSSystem from './POSSystem';

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  // If it's the POS system, render the actual POS component
  if (title === 'Point of Sale') {
    return <POSSystem />;
  }

  return (
    <div className="p-6 flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            This feature is currently under development and will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}