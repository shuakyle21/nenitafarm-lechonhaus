import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Order } from '../types';

// Define styles
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
    },
    title: {
        fontSize: 20,
        color: '#DC2626', // Red
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#3C3C3C',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        color: '#000000',
        marginBottom: 10,
        marginTop: 20,
        fontWeight: 'bold',
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#e5e7eb',
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableCol: {
        width: '50%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#e5e7eb',
    },
    tableCellHeader: {
        margin: 5,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    tableCell: {
        margin: 5,
        fontSize: 10,
    },
    summaryHeader: {
        backgroundColor: '#3C3C3C',
    },
    expenseHeader: {
        backgroundColor: '#DC2626',
    },
    textRight: {
        textAlign: 'right',
    },
    textRed: {
        color: '#DC2626',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        fontSize: 8,
        color: '#9CA3AF',
        flexDirection: 'row',
        justifyContent: 'space-between',
    }
});

interface Expense {
    id: string;
    amount: number;
    reason: string;
    requested_by: string;
    date: string;
}

interface FinancialReportPDFProps {
    orders: Order[];
    expenses: Expense[];
    title: string;
}

const FinancialReportPDF: React.FC<FinancialReportPDFProps> = ({ orders, expenses, title }) => {
    // Calculate Totals
    const reportSales = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const reportExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const reportNet = reportSales - reportExpenses;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    {/* Logo */}
                    <View style={{ marginBottom: 10, alignItems: 'center' }}>
                        <Image src="/assets/logo.png" style={{ width: 100, height: 60, objectFit: 'contain' }} />
                    </View>
                    <Text style={styles.title}>NENITA FARM LECHON HAUS and CATERING SERVICES</Text>
                    <Text style={styles.subtitle}>{title}</Text>
                </View>

                {/* Financial Summary */}
                <Text style={styles.sectionTitle}>Financial Summary</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.summaryHeader]}>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCellHeader}>Metric</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCellHeader, styles.textRight]}>Amount</Text>
                        </View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>Total Gross Sales</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCell, styles.textRight]}>P {reportSales.toLocaleString()}</Text>
                        </View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>Total Expenses</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCell, styles.textRight]}>P {reportExpenses.toLocaleString()}</Text>
                        </View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>Net Cash</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={[styles.tableCell, styles.textRight]}>P {reportNet.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Expense Breakdown */}
                <Text style={styles.sectionTitle}>Expense Breakdown</Text>
                {expenses.length > 0 ? (
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.expenseHeader]}>
                            <View style={{ ...styles.tableCol, width: '25%' }}>
                                <Text style={styles.tableCellHeader}>Date</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '35%' }}>
                                <Text style={styles.tableCellHeader}>Reason</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '25%' }}>
                                <Text style={styles.tableCellHeader}>Requested By</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={[styles.tableCellHeader, styles.textRight]}>Amount</Text>
                            </View>
                        </View>
                        {expenses.map((e, i) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={{ ...styles.tableCol, width: '25%' }}>
                                    <Text style={styles.tableCell}>{new Date(e.date).toLocaleDateString()}</Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '35%' }}>
                                    <Text style={styles.tableCell}>{e.reason}</Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '25%' }}>
                                    <Text style={styles.tableCell}>{e.requested_by}</Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '15%' }}>
                                    <Text style={[styles.tableCell, styles.textRight, styles.textRed]}>P {e.amount.toLocaleString()}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>No expenses recorded for this period.</Text>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Generated on {new Date().toLocaleString()}</Text>
                    <Text render={({ pageNumber, totalPages }) => (
                        `Page ${pageNumber} of ${totalPages}`
                    )} fixed />
                </View>
            </Page>
        </Document>
    );
};

export default FinancialReportPDF;
