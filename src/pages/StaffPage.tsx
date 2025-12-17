import React from 'react';
import StaffModule from '@/components/StaffModule';
// Note: StaffModule currently handles its own data fetching or we might lift it?
// Checking App.tsx, StaffModule was rendered as <StaffModule /> with no props.
// BUT App.tsx had `useStaff`?
// In App.tsx:
// {activeModule === 'STAFF' && <StaffModule />}
// But App.tsx ALSO had: const { staffList } = useStaff(isAuthenticated);
// And passed staffList to PosModule.
// StaffModule itself likely fetches its own data or needs refactoring?
// Let's assume StaffModule handles its own fetching for now, OR we should pass props?
// Looking at previous `cat src/services/staffService.ts`, we created `getStaff`.
// Looking at `StaffModule.tsx`, we haven't seen it.
// Let's create the page assuming StaffModule might be self-contained or we update it later.
// However, to follow the pattern, StaffPage should fetch data.
// Let's inspect StaffModule props if we can.
// But based on App.tsx usage `<StaffModule />` (no props), it seems self-contained.
// So StaffPage just wraps it.

const StaffPage: React.FC = () => {
  return <StaffModule />;
};

export default StaffPage;
