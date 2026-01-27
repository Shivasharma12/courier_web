'use client';

import { DollarSign, Save, Loader2, Info, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

export default function PricingRulesPage() {
    const [loading, setLoading] = useState(false);
    const [rules, setRules] = useState({
        basePrice: 5.00,
        perKg: 2.00,
        distanceSurcharge: 0.50,
        priorityMultiplier: 1.5,
    });

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1000); // Simulate save
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Pricing Configuration</h1>
                <p className="text-slate-500 mt-1">Define global pricing strategies based on weight, distance, and priority.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-600" /> Standard Rates
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-slate-700 block mb-2 uppercase tracking-wide">Base Delivery Fee ($)</label>
                            <input
                                type="number"
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 text-lg font-bold outline-none"
                                value={isNaN(rules.basePrice) ? '' : rules.basePrice}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setRules({ ...rules, basePrice: isNaN(val) ? 0 : val });
                                }}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 block mb-2 uppercase tracking-wide">Rate per Kilogram ($/kg)</label>
                            <input
                                type="number"
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 text-lg font-bold outline-none"
                                value={isNaN(rules.perKg) ? '' : rules.perKg}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setRules({ ...rules, perKg: isNaN(val) ? 0 : val });
                                }}
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
                        <Info className="h-6 w-6 text-blue-600 flex-shrink-0" />
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Base fee applies to all orders. Weight charges are calculated per 100g. Prices are automatically updated for all customers in real-time.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Save Pricing Policy
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-4">Price Preview</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                <span className="text-sm text-slate-500 font-medium">Small Parcel (0.5kg)</span>
                                <span className="text-lg font-bold text-slate-900">${(rules.basePrice + (0.5 * rules.perKg)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                <span className="text-sm text-slate-500 font-medium">Medium Parcel (2.5kg)</span>
                                <span className="text-lg font-bold text-slate-900">${(rules.basePrice + (2.5 * rules.perKg)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border-2 border-blue-600">
                                <span className="text-sm text-blue-600 font-bold">Priority Delivery (x{rules.priorityMultiplier})</span>
                                <span className="text-lg font-bold text-blue-600">${((rules.basePrice + (1 * rules.perKg)) * rules.priorityMultiplier).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                            <div className="bg-white/20 p-2.5 rounded-xl">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <ArrowUpRight className="h-6 w-6 text-white/50" />
                        </div>
                        <h4 className="text-xl font-bold mb-2">Profit Optimization</h4>
                        <p className="text-blue-100 text-sm leading-relaxed mb-6">Your current rates are 8% higher than industry average. Consider reducing base fee to increase volume.</p>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="bg-white h-full w-3/4 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add TrendingUp icon
function TrendingUp({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    );
}
