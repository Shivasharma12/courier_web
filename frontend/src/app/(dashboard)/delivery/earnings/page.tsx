'use client';

import {
    DollarSign,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Eye,
    ChevronRight,
    Search
} from 'lucide-react';

export default function EarningsPage() {
    // Mock data for the earnings page
    const earningsData = [
        { id: '1', date: '2026-01-24', orderId: 'TRK9281726', amount: 25.50, status: 'paid', type: 'Local Delivery' },
        { id: '2', date: '2026-01-23', orderId: 'TRK1827364', amount: 42.00, status: 'paid', type: 'Hub Transfer' },
        { id: '3', date: '2026-01-23', orderId: 'TRK3645271', amount: 15.00, status: 'paid', type: 'Pickup Task' },
        { id: '4', date: '2026-01-22', orderId: 'TRK0918273', amount: 35.75, status: 'paid', type: 'Local Delivery' },
        { id: '5', date: '2026-01-21', orderId: 'TRK5544332', amount: 28.25, status: 'paid', type: 'Hub Transfer' },
    ];

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Earnings</h1>
                    <p className="text-slate-500 mt-1">Track your performance and manage your payouts.</p>
                </div>
                <button className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                    <Download className="h-4 w-4" /> Export Statement
                </button>
            </div>

            {/* Earnings Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-blue-200 text-xs font-bold bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
                            <ArrowUpRight className="h-3 w-3" /> +12.5%
                        </span>
                    </div>
                    <p className="text-blue-100 text-sm font-medium uppercase tracking-widest">Total Balance</p>
                    <h2 className="text-4xl font-black mt-1">$1,280.50</h2>
                    <button className="mt-8 w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all">
                        Withdraw Funds
                    </button>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="bg-green-100 p-3 rounded-2xl">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Weekly Earnings</p>
                    <h2 className="text-4xl font-black text-slate-900 mt-1">$452.25</h2>
                    <div className="mt-8 flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg w-fit">
                        <ArrowUpRight className="h-3 w-3" /> Higher than last week
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="bg-purple-100 p-3 rounded-2xl">
                            <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Pending Payout</p>
                    <h2 className="text-4xl font-black text-slate-900 mt-1">$105.00</h2>
                    <p className="mt-8 text-xs text-slate-400 font-medium italic">Next payout scheduled for Monday</p>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-lg">Payment History</h3>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {earningsData.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5 text-sm font-bold text-slate-900">#{row.orderId}</td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{row.type}</span>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">{new Date(row.date).toLocaleDateString()}</td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-900 text-right">${row.amount.toFixed(2)}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-green-100 text-green-700 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                                            <CheckCircle className="h-3 w-3" /> {row.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex justify-center">
                    <button className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-all">
                        View All Transactions <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// CheckCircle helper for status badge
function CheckCircle({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}
