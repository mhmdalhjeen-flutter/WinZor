import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ title = 'لا يوجد محتوى', description, action }) => (
  <div className="py-16 text-center space-y-3 px-6">
    <PackageOpen size={48} className="mx-auto text-gray-300" />
    <h3 className="font-black text-gray-700">{title}</h3>
    {description && <p className="text-sm text-gray-400 font-bold">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
