import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
    borderBottom: '2pt solid #8B0000',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 10,
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#f8f8f8',
    padding: 6,
    marginBottom: 10,
    color: '#8B0000',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '1pt solid #eee',
  },
  label: {
    fontWeight: 'bold',
  },
  value: {
    textAlign: 'right',
  },
  summaryBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  summaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  discrepancyBox: {
    marginTop: 15,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  noteTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: '1pt solid #eee',
    paddingTop: 10,
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureLine: {
    borderTop: '1pt solid #333',
    width: 180,
    paddingTop: 4,
    textAlign: 'center',
  }
});

interface ReconciliationData {
  openingFund: number;
  cashSales: number;
  expenses: number;
  cashDrops: number;
  expectedCash: number;
  actualCash: number;
  discrepancy: number;
}

interface DailyReconciliationPDFProps {
  data: ReconciliationData;
  date: string;
  auditor: string;
}

const DailyReconciliationPDF: React.FC<DailyReconciliationPDFProps> = ({ data, date, auditor }) => {
  const isDiscrepancyZero = Math.abs(data.discrepancy) < 0.01;
  const isShortage = data.discrepancy > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src="/assets/logo.png" style={styles.logo} />
          <Text style={styles.title}>NENITA FARM LECHON HAUS</Text>
          <Text style={styles.subtitle}>Daily Cash Reconciliation Report</Text>
          <Text style={{ marginTop: 10, fontSize: 10 }}>Date: {date}</Text>
        </View>

        {/* System Totals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Records (Expected)</Text>
          <View style={styles.row}>
            <Text>Opening Fund / Petty Cash</Text>
            <Text style={styles.value}>PHP {data.openingFund.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.row}>
            <Text>Total Cash Sales</Text>
            <Text style={styles.value}>PHP {data.cashSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.row}>
            <Text>Total Expenses (Cash Out)</Text>
            <Text style={[styles.value, { color: '#dc2626' }]}>- PHP {data.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.row}>
            <Text>Cash Drops (Vault Transfers)</Text>
            <Text style={[styles.value, { color: '#dc2626' }]}>- PHP {data.cashDrops.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={[styles.row, { borderBottom: 'none', marginTop: 10 }]}>
            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>SYSTEM EXPECTED CASH</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>PHP {data.expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Actual Counts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Count (Reporting)</Text>
          <View style={styles.summaryBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#fff', fontSize: 13 }}>ACTUAL CASH IN DRAWER</Text>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>PHP {data.actualCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>

          <View style={[
            styles.discrepancyBox, 
            { 
              borderColor: isDiscrepancyZero ? '#16a34a' : '#dc2626',
              backgroundColor: isDiscrepancyZero ? '#f0fdf4' : '#fef2f2'
            }
          ]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[styles.label, { color: isDiscrepancyZero ? '#15803d' : '#991b1b' }]}>
                {isDiscrepancyZero ? 'RECONCILED' : (isShortage ? 'CASH SHORTAGE' : 'CASH OVERAGE')}
              </Text>
              <Text style={[styles.value, { fontWeight: 'bold', color: isDiscrepancyZero ? '#15803d' : '#991b1b' }]}>
                PHP {Math.abs(data.discrepancy).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Auditor Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audit Notification</Text>
          <Text style={styles.noteText}>
            This report represents the verified daily cash flow as of {new Date().toLocaleString("en-PH", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}. 
            Any discrepancies exceeding PHP 50.00 have been flagged for manual investigation of the 
            system audit trail (Activity Logs). Once locked, this report serves as a formal financial record.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View>
            <View style={styles.signatureLine}>
              <Text style={{ fontWeight: 'bold' }}>{auditor}</Text>
            </View>
            <Text style={{ fontSize: 8, textAlign: 'center' }}>Prepared By (Auditor)</Text>
          </View>
          <View>
            <View style={styles.signatureLine}>
              <Text>_______________________</Text>
            </View>
            <Text style={{ fontSize: 8, textAlign: 'center' }}>Approved By (Manager)</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Nenita Farm Lechon Haus POS System - Official Financial Document
          {"\n"}Report ID: REC-{Date.now().toString().slice(-8)} | Generated: {new Date().toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </Text>
      </Page>
    </Document>
  );
};

export default DailyReconciliationPDF;
