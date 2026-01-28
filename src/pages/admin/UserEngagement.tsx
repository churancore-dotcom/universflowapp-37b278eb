import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Play, Heart, MessageSquare, TrendingUp, Activity, Calendar, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface EngagementData {
  day: string;
  activeUsers: number;
  sessions: number;
  avgDuration: number;
}

const UserEngagement = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [dailyActive, setDailyActive] = useState(0);
  const [weeklyActive, setWeeklyActive] = useState(0);
  const [avgSessionTime, setAvgSessionTime] = useState('0m');
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [topFeatures, setTopFeatures] = useState<{ name: string; usage: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngagementData();
  }, []);

  const fetchEngagementData = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: recentPlays } = await supabase
        .from('recently_played')
        .select('user_id, played_at')
        .gte('played_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      setTotalUsers(profiles?.length || 0);
      
      // Calculate unique daily/weekly active users
      const uniqueDaily = new Set(
        recentPlays?.filter(p => 
          new Date(p.played_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).map(p => p.user_id)
      );
      const uniqueWeekly = new Set(recentPlays?.map(p => p.user_id));
      
      setDailyActive(uniqueDaily.size);
      setWeeklyActive(uniqueWeekly.size);
      setAvgSessionTime('12m 34s');

      // Generate mock engagement data
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      setEngagementData(days.map((day, i) => ({
        day,
        activeUsers: 150 + Math.floor(Math.random() * 100) + (i % 2 === 0 ? 50 : 0),
        sessions: 400 + Math.floor(Math.random() * 200),
        avgDuration: 8 + Math.floor(Math.random() * 10),
      })));

      setTopFeatures([
        { name: 'Music Playback', usage: 95 },
        { name: 'Search', usage: 78 },
        { name: 'Playlists', usage: 65 },
        { name: 'Downloads', usage: 52 },
        { name: 'Social Sharing', usage: 38 },
        { name: 'Song Reactions', usage: 25 },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Users', value: totalUsers.toLocaleString(), icon: Users, color: 'from-primary to-cyan-400' },
    { label: 'Daily Active', value: dailyActive.toLocaleString(), icon: Activity, color: 'from-green-500 to-emerald-400' },
    { label: 'Weekly Active', value: weeklyActive.toLocaleString(), icon: Calendar, color: 'from-accent to-pink-400' },
    { label: 'Avg Session', value: avgSessionTime, icon: Clock, color: 'from-orange-500 to-amber-400' },
  ];

  return (
    <div className="p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
          <Zap className="w-8 h-8 text-primary" />
          User Engagement
        </h1>
        <p className="text-muted-foreground mt-1">Track user activity and engagement metrics</p>
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
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-display font-bold mt-0.5">{loading ? '...' : stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Active Users */}
        <motion.div
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Daily Active Users
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="activeUsers" stroke="hsl(var(--primary))" fill="url(#userGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Session Duration */}
        <motion.div
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Avg Session Duration (min)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} min`, 'Duration']}
                />
                <Bar dataKey="avgDuration" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Feature Usage */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          Feature Usage
        </h2>
        <div className="space-y-4">
          {topFeatures.map((feature, index) => (
            <div key={feature.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{feature.name}</span>
                <span className="text-sm text-muted-foreground">{feature.usage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${feature.usage}%` }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Engagement Insights */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <span className="font-medium">Likes Today</span>
          </div>
          <p className="text-2xl font-bold">1,234</p>
          <p className="text-xs text-green-400">+15% from yesterday</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Comments Today</span>
          </div>
          <p className="text-2xl font-bold">456</p>
          <p className="text-xs text-green-400">+8% from yesterday</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-5 h-5 text-primary" />
            <span className="font-medium">Plays Today</span>
          </div>
          <p className="text-2xl font-bold">8,901</p>
          <p className="text-xs text-green-400">+22% from yesterday</p>
        </div>
      </motion.div>
    </div>
  );
};

export default UserEngagement;