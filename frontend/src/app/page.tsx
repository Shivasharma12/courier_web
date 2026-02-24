'use client';

import Link from 'next/link';
import { Truck, Shield, Globe, Clock, Package, ArrowRight, Star, Zap, Users, MapPin, CheckCircle2, TrendingUp, ChevronRight, LayoutDashboard, Database, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState({ parcels: 0, customers: 0, hubs: 0, travelers: 0 });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Animate counters
    const animateValue = (key: keyof typeof stats, end: number, duration: number) => {
      let start = 0;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setStats(prev => ({ ...prev, [key]: end }));
          clearInterval(timer);
        } else {
          setStats(prev => ({ ...prev, [key]: Math.floor(start) }));
        }
      }, 16);
    };

    animateValue('parcels', 50000, 2000);
    animateValue('customers', 2500, 2000);
    animateValue('hubs', 150, 2000);
    animateValue('travelers', 850, 2000);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${scrolled ? 'bg-background/80 backdrop-blur-md border-border py-3 shadow-sm' : 'bg-transparent border-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Courier<span className="text-primary">Hub</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-10">
              <Link href="#ecosystem" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Ecosystem</Link>
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link href="#network" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Network</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden sm:block text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
              <Link href="/register" className="bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all">
                Join Network
              </Link>
              <ThemeToggle className="ml-2" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-in-left">
              <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Connecting Travelers & Hubs
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                Your Parcel's <br />
                <span className="text-gradient">Fastest Journey.</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-xl">
                The smart ecosystem connecting **Traveler Customers**, **Hub Owners**, and **Enterprise Admins** for the safest and most efficient global delivery network.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/register" className="group bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  Ship a Parcel
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/track" className="bg-background text-foreground border border-border px-8 py-4 rounded-full font-bold text-lg hover:bg-muted/50 transition-all flex items-center justify-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Track Shipment
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-x-12 gap-y-6 pt-8 border-t border-border">
                {[
                  { label: 'Total Shipments', value: `${stats.parcels.toLocaleString()}+` },
                  { label: 'Active Travelers', value: `${stats.travelers.toLocaleString()}` },
                  { label: 'Partner Hubs', value: stats.hubs },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative animate-slide-in-right lg:block hidden">
              <div className="relative group perspective-1000">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative glass rounded-[2.5rem] p-3 shadow-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=1200"
                    alt="Logistics Network"
                    className="rounded-[2rem] shadow-inner"
                  />
                  {/* Floating Elements */}
                  <div className="absolute top-6 right-6 bg-background/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-border animate-float">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-xl">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Real-time Oversite</div>
                        <div className="text-sm font-bold text-primary">Admin Control Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section id="ecosystem" className="py-32 bg-secondary/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-primary font-bold tracking-widest text-xs uppercase mb-4">Our Network</h2>
            <h3 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">Designed for Everyone.</h3>
            <p className="text-lg text-muted-foreground italic">Our platform thrives on the synergy between three distinct participants.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Traveler Customers */}
            <div className="glass p-10 rounded-[2.5rem] border-primary/10 hover-lift group">
              <div className="bg-blue-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4">Traveler Customers</h4>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Deliver your parcels faster and safer by connecting with our verified travel network. Speed, efficiency, and zero-compromise safety.
              </p>
              <ul className="space-y-3 text-sm font-medium text-foreground/80">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Express Hub Routing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Digital Proof of Delivery</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Cost-effective Choices</li>
              </ul>
            </div>

            {/* Hub Owners */}
            <div className="glass p-10 rounded-[2.5rem] border-indigo-500/10 hover-lift group">
              <div className="bg-indigo-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4">Hub Owners</h4>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Turn your storage space into a vital node in our global network. Manage capacity, inventory, and transfers through a unified interface.
              </p>
              <ul className="space-y-3 text-sm font-medium text-foreground/80">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-600" /> Automated Inventory Sync</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-600" /> High-volume Scalability</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-600" /> Infrastructure Analytics</li>
              </ul>
            </div>

            {/* Admin Management */}
            <div className="glass p-10 rounded-[2.5rem] border-purple-500/10 hover-lift group">
              <div className="bg-purple-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4">Control Terminal</h4>
              <p className="text-muted-foreground leading-relaxed mb-6">
                One powerful dashboard to oversee everything. Track all orders, monitor hub health, and manage system users from a central management platform.
              </p>
              <ul className="space-y-3 text-sm font-medium text-foreground/80">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-purple-600" /> Global Order Visibility</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-purple-600" /> System-wide Fleet Tracking</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-purple-600" /> Revenue & Performance KPIs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section id="features" className="py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="relative group animate-slide-in-left lg:block hidden">
              <img
                src="https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&q=80&w=1000"
                className="rounded-[3rem] shadow-2xl relative"
                alt="Logistics Technology"
              />
              <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-20 -z-10" />
            </div>

            <div className="animate-slide-in-right">
              <h2 className="text-primary font-bold tracking-widest text-xs uppercase mb-4">Our Technology</h2>
              <h3 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-8">Efficient. Safe. <br />Transparent.</h3>

              <div className="space-y-10">
                {[
                  { title: 'Smart Route Calculation', desc: 'AI-driven path optimization for multi-hub transfers, reducing delivery time by up to 30%.', icon: Zap },
                  { title: 'OTP Handover Protocol', desc: 'State-of-the-art security with unique codes at every transfer node in the ecosystem.', icon: Shield },
                  { title: 'Global Multi-Hub Network', desc: 'Access an ever-expanding infrastructure of physical hubs for inventory-less delivery.', icon: Globe },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary transition-colors">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-muted-foreground leading-relaxed italic">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-24 pb-12 bg-slate-50 dark:bg-slate-950 border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 text-center md:text-left">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-6 justify-center md:justify-start">
                <div className="bg-primary p-2 rounded-xl">
                  <Truck className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">CourierHub</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">The ecosystem that connects travelers, hub owners, and management for a smarter future in logistics.</p>
            </div>

            <div>
              <h5 className="font-bold text-sm mb-6 uppercase tracking-widest text-primary">Personas</h5>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li><Link href="/register" className="hover:text-primary transition-colors">Ship as Traveler</Link></li>
                <li><Link href="/register" className="hover:text-primary transition-colors">Partner as Hub Owner</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">Management Portal</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-sm mb-6 uppercase tracking-widest text-primary">Support</h5>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Network Status</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contact Support</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-sm mb-6 uppercase tracking-widest text-primary">Admin Access</h5>
              <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-border dark:border-white/10 shadow-sm">
                <p className="text-xs text-muted-foreground mb-3 font-medium">Login to oversee all orders and manage hub operations.</p>
                <Link href="/login" className="block text-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-all">Go to Dashboard</Link>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-muted-foreground">© 2026 CourierHub Technologies, Inc. All rights reserved.</p>
            <div className="flex gap-8 text-xs font-semibold text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
