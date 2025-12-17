import React from 'react';
import BookingModule from '@/components/BookingModule';
import { useMenu } from '@/hooks/useMenu';

const BookingPage: React.FC = () => {
  const { menuItems } = useMenu(true);

  return <BookingModule items={menuItems} />;
};

export default BookingPage;
