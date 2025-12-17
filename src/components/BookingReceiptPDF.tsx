import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Booking } from '../types';
import { format, parseISO } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    color: '#DC2626',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 5,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#666666',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 10,
  },
  itemsTable: {
    marginTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingVertical: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000000',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
  },
});

interface BookingReceiptPDFProps {
  booking: Booking;
}

const BookingReceiptPDF: React.FC<BookingReceiptPDFProps> = ({ booking }) => {
  return (
    <Document>
      <Page size="A6" style={styles.page}>
        {' '}
        {/* A6 is good for receipts */}
        <View style={styles.header}>
          <Text style={styles.title}>NENITA FARM LECHON HAUS</Text>
          <Text style={styles.subtitle}>& CATERING SERVICES</Text>
          <Text style={styles.subtitle}>Purok 1, Brgy. Sampao, Isulan, Sultan Kudarat</Text>
          <Text style={styles.subtitle}>Contact: 0975-573-7787 / 0926-933-7787</Text>
        </View>
        <Text style={styles.receiptTitle}>Official Receipt</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{format(new Date(), 'MMM d, yyyy h:mm a')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Booking Ref:</Text>
            <Text style={styles.value}>{booking.id?.substring(0, 8).toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{booking.customer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact:</Text>
            <Text style={styles.value}>{booking.contact_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{booking.type.replace('_', ' ')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Event Date:</Text>
            <Text style={styles.value}>
              {format(parseISO(booking.booking_date), 'MMM d, yyyy')} @ {booking.booking_time}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        {booking.items && booking.items.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.label, { marginBottom: 5 }]}>Order Details:</Text>
            {booking.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={[styles.value, { width: '60%' }]}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.value}>₱{item.finalPrice.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.totalValue}>₱{booking.total_amount?.toLocaleString() || '0'}</Text>
        </View>
        <View style={[styles.row, { marginTop: 5 }]}>
          <Text style={styles.label}>Payment Method:</Text>
          <Text style={styles.value}>{booking.payment_method || 'CASH'}</Text>
        </View>
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>This is a system generated receipt.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default BookingReceiptPDF;
