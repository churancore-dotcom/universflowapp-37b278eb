import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Users, Crown, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface RevenueData {
  month: string;
  subscriptions: number;
  donations: number;
  total: number;
}

interface SubscriptionBreakdown {
  type: string;
  count: number;
  revenue: number;
  color: string;
}

const RevenueAnalytics = () => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState(0);
  const [activeSubscribers, setActiveSubscribers] = useState(0);
  const [avgRevPerUser, setAvgRevPerUser] = useState(0);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [subscriptionBreakdown, setSubscriptionBreakdown] = useState<SubscriptionBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      // Fetch subscriptions
      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('status', 'active');

      // Fetch donations
      const { data: donations } = await supabase
        .from('donations')
        .select('*');

      const totalDonations = donations?.reduce((acc, d) => acc + d.amount, 0) || 0;
      
      // Calculate subscription revenue (mock pricing)
      const monthlyCount = subs?.filter(s => s.subscription_type === 'premium_monthly').length || 0;
      const yearlyCount = subs?.filter(s => s.subscription_type === 'premium_yearly').length || 0;
      const subRevenue = (monthlyCount * 9.99) + (yearlyCount * 99.99 / 12);
      
      setTotalRevenue(subRevenue + totalDonations);
      setActiveSubscribers((subs?.length || 0));
      setMonthlyGrowth(12.5); // Mock growth rate
      setAvgRevPerUser(subs?.length ? (subRevenue + totalDonations) / subs.length : 0);

      // Generate mock monthly data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      setRevenueData(months.map((month, i) => ({
        month,
        subscriptions: 500 + Math.floor(Math.random() * 300) + (i * 50),
        donations: 100 + Math.floor(Math.random() * 100),
        total: 600 + Math.floor(Math.random() * 400) + (i * 50),
      })));

      setSubscriptionBreakdown([
        { type: 'Monthly Premium', count: monthlyCount, revenue: monthlyCount * 9.99, color: 'hsl(var(--primary))' },
        { type: 'Yearly Premium', count: yearlyCount, revenue: yearlyCount * 99.99, color: 'hsl(var(--accent))' },
        { type: 'Donations', count: donations?.length || 0, revenue: totalDonations, color: '#22c55e' },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setLoading(false);
    }
  };

  const stats = [
    { 
      label: 'Total Revenue', 
      value: `$${totalRevenue.toFixed(2)}`, 
      icon: DollarSign, 
      change: `+${monthlyGrowth}%`,
      isPositive: true 
    },
    { 
      label: 'Active Subscribers', 
      value: activeSubscribers.toString(), 
      icon: Crown, 
      change: '+8.2%',
      isPositive: true 
    },
    { 
      label: 'Avg Revenue/User', 
      value: `$${avgRevPerUser.toFixed(2)}`, 
      icon: Users, 
      change: '+3.1%',
      isPositive: true 
    },
    { 
      label: 'Monthly Growth', 
      value: `${monthlyGrowth}%`, 
      icon: TrendingUp, 
      change: '+2.4%',
      isPositive: true 
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-primary" />
          Revenue Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Track your platform's financial performance</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="glass rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className={`flex items-center text-xs font-medium ${
                  stat.isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-display font-bold mt-0.5">{loading ? '...' : stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Over Time */}
        <motion.div
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Revenue Over Time
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                  formatter={(value: number) => [`$${value}`, '']}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#revenueGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Revenue Breakdown */}
        <motion.div
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-accent" />
            Revenue Breakdown
          </h2>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="revenue"
                >
                  {subscriptionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {subscriptionBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${item.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{item.count} users</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-display font-bold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold text-primary">85%</p>
            <p className="text-sm text-muted-foreground">Retention Rate</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold text-green-400">3.2%</p>
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold text-accent">$24.50</p>
            <p className="text-sm text-muted-foreground">Lifetime Value</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold text-orange-400">2.1%</p>
            <p className="text-sm text-muted-foreground">Churn Rate</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RevenueAnalytics;