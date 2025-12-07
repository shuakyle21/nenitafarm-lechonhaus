import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Order, CartItem } from '../types';

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
    adjustmentHeader: {
        backgroundColor: '#16A34A', // Green
    },
    textRight: {
        textAlign: 'right',
    },
    textRed: {
        color: '#DC2626',
    },
    textGreen: {
        color: '#16A34A',
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

interface SalesAdjustment {
    id: string;
    amount: number;
    reason: string;
    added_by: string;
    date: string;
}

interface FinancialReportPDFProps {
    orders: Order[];
    expenses: Expense[];
    salesAdjustments: SalesAdjustment[];
    title: string;
}

const FinancialReportPDF: React.FC<FinancialReportPDFProps> = ({ orders, expenses, salesAdjustments, title }) => {
    // Calculate Totals
    const ordersTotal = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const adjustmentsTotal = salesAdjustments.reduce((acc, s) => acc + s.amount, 0);
    const reportSales = ordersTotal + adjustmentsTotal;
    const reportExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const reportNet = reportSales - reportExpenses;

    const formatItemString = (item: CartItem) => {
        if (item.weight) {
            // Strip default unit from name if present for cleaner display
            const cleanName = item.name.replace(' (1 Kilo)', '');

            const weightInGrams = item.weight * 1000;
            const weightStr = weightInGrams < 1000
                ? `${Math.round(weightInGrams)}g`
                : `${item.weight.toFixed(2)}kg`;

            return `${item.quantity}x ${cleanName} (${weightStr})`;
        }
        return `${item.quantity}x ${item.name}`;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    {/* Logo */}
                    <View style={{ marginBottom: 10, alignItems: 'center' }}>
                        <Image src="/assets/logo.png" style={{ width: 150, height: 80, objectFit: 'contain' }} />
                    </View>
                    {/* Commented out logo as it might cause issues if path is wrong, user can uncomment */}
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

                {/* Sales Adjustments Breakdown */}
                {salesAdjustments.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Sales Adjustments (Added to Sales)</Text>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.adjustmentHeader]}>
                                <View style={{ ...styles.tableCol, width: '25%' }}>
                                    <Text style={styles.tableCellHeader}>Date</Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '35%' }}>
                                    <Text style={styles.tableCellHeader}>Reason</Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '25%' }}>
                                    <Text style={styles.tableCellHeader}>Added By</Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '15%' }}>
                                    <Text style={[styles.tableCellHeader, styles.textRight]}>Amount</Text>
                                </View>
                            </View>
                            {salesAdjustments.map((s, i) => (
                                <View key={i} style={styles.tableRow}>
                                    <View style={{ ...styles.tableCol, width: '25%' }}>
                                        <Text style={styles.tableCell}>{new Date(s.date).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={{ ...styles.tableCol, width: '35%' }}>
                                        <Text style={styles.tableCell}>{s.reason}</Text>
                                    </View>
                                    <View style={{ ...styles.tableCol, width: '25%' }}>
                                        <Text style={styles.tableCell}>{s.added_by}</Text>
                                    </View>
                                    <View style={{ ...styles.tableCol, width: '15%' }}>
                                        <Text style={[styles.tableCell, styles.textRight, styles.textGreen]}>P {s.amount.toLocaleString()}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                        {/* Sales Adjustment Total Footer */}
                        <View style={[styles.table, { borderTopWidth: 0, marginTop: -1 }]}>
                            <View style={styles.tableRow}>
                                <View style={{ ...styles.tableCol, width: '85%', borderRightWidth: 0 }}>
                                    <Text style={[styles.tableCell, styles.textRight, { fontWeight: 'bold' }]}>TOTAL SALES ADJUSTMENT</Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '15%' }}>
                                    <Text style={[styles.tableCell, styles.textRight, { fontWeight: 'bold', color: '#16A34A' }]}>P {adjustmentsTotal.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Transaction History (Orders) */}
                <Text style={styles.sectionTitle}>Transaction History</Text>
                {orders.length > 0 ? (
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.summaryHeader]}>
                            <View style={{ ...styles.tableCol, width: '20%' }}>
                                <Text style={styles.tableCellHeader}>Order ID</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '25%' }}>
                                <Text style={styles.tableCellHeader}>Date & Time</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={styles.tableCellHeader}>Type</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '25%' }}>
                                <Text style={styles.tableCellHeader}>Items</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={[styles.tableCellHeader, styles.textRight]}>Total</Text>
                            </View>
                        </View>
                        {orders.map((order) => (
                            <View key={order.id} style={styles.tableRow}>
                                <View style={{ ...styles.tableCol, width: '20%' }}>
                                    <Text style={styles.tableCell}>#{order.orderNumber || order.id.substring(0, 8)}</Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '25%' }}>
                                    <Text style={styles.tableCell}>
                                        {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '15%' }}>
                                    <Text style={styles.tableCell}>{order.orderType || 'DINE_IN'}</Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '25%' }}>
                                    <Text style={styles.tableCell}>
                                        {order.items.map(formatItemString).join(', ')}
                                        {'\n'}
                                        <Text style={{ color: '#6B7280', fontSize: 8 }}>
                                            {order.items.length} items total
                                        </Text>
                                    </Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '15%' }}>
                                    <Text style={[styles.tableCell, styles.textRight]}>P {order.total.toLocaleString()}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>No transactions recorded for this period.</Text>
                )}
                {/* Transaction History Total - Added Footer */}
                {orders.length > 0 && (
                    <View style={[styles.table, { borderTopWidth: 0, marginTop: -1 }]}>
                        <View style={styles.tableRow}>
                            <View style={{ ...styles.tableCol, width: '85%', borderRightWidth: 0 }}>
                                <Text style={[styles.tableCell, styles.textRight, { fontWeight: 'bold' }]}>TOTAL TRANSACTION HISTORY</Text>
                            </View>
                            <View style={{ ...styles.tableCol, width: '15%' }}>
                                <Text style={[styles.tableCell, styles.textRight, { fontWeight: 'bold' }]}>P {ordersTotal.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Expense Breakdown */}
                <Text style={styles.sectionTitle}>Expense Breakdown</Text>
                {expenses.length > 0 ? (
                    <>
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
                        {/* Expense Total Footer */}
                        <View style={[styles.table, { borderTopWidth: 0, marginTop: -1 }]}>
                            <View style={styles.tableRow}>
                                <View style={{ ...styles.tableCol, width: '85%', borderRightWidth: 0 }}>
                                    <Text style={[styles.tableCell, styles.textRight, { fontWeight: 'bold' }]}>TOTAL EXPENSES</Text>
                                </View>
                                <View style={{ ...styles.tableCol, width: '15%' }}>
                                    <Text style={[styles.tableCell, styles.textRight, { fontWeight: 'bold', color: '#DC2626' }]}>P {reportExpenses.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    </>
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
