import React from 'react';
import InventoryModule from '@/components/InventoryModule';

interface InventoryPageProps {
  userId: string | null;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ userId }) => {
  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <InventoryModule userId={userId} />
    </div>
  );
};

export default InventoryPage;
