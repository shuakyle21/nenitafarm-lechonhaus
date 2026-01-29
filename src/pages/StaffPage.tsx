import React, { useState } from 'react';
import StaffManagementModule from '@/components/StaffManagementModule';
import FinancialLedger from '@/components/FinancialLedger';
import BulkPayrollGeneration from '@/components/BulkPayrollGeneration';

type StaffView = 'management' | 'ledger' | 'payroll';

const StaffPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<StaffView>('management');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {currentView === 'management' && (
        <StaffManagementModule />
      )}
      {currentView === 'ledger' && (
        <FinancialLedger onBack={() => setCurrentView('management')} />
      )}
      {currentView === 'payroll' && (
        <BulkPayrollGeneration />
      )}
    </div>
  );
};

export default StaffPage;
