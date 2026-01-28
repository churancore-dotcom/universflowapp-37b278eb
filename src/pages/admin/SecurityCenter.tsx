import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, AlertTriangle, CheckCircle2, XCircle, Eye, Key, Users, Activity, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  type: 'login' | 'failed_login' | 'password_change' | 'suspicious' | 'blocked';
  user: string;
  ip: string;
  location: string;
  timestamp: Date;
  details: string;
}

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

const SecurityCenter = () => {
  const [securityScore, setSecurityScore] = useState(85);
  const [events, setEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'login',
      user: 'admin@example.com',
      ip: '192.168.1.100',
      location: 'New York, US',
      timestamp: new Date(),
      details: 'Successful login'
    },
    {
      id: '2',
      type: 'failed_login',
      user: 'user@example.com',
      ip: '10.0.0.55',
      location: 'London, UK',
      timestamp: new Date(Date.now() - 3600000),
      details: 'Invalid password attempt'
    },
    {
      id: '3',
      type: 'suspicious',
      user: 'test@example.com',
      ip: '203.0.113.0',
      location: 'Unknown',
      timestamp: new Date(Date.now() - 7200000),
      details: 'Multiple login attempts from different locations'
    },
    {
      id: '4',
      type: 'blocked',
      user: 'attacker@spam.com',
      ip: '192.0.2.1',
      location: 'China',
      timestamp: new Date(Date.now() - 10800000),
      details: 'Blocked due to suspicious activity'
    }
  ]);

  const [settings, setSettings] = useState<SecuritySetting[]>([
    { id: '1', name: 'Two-Factor Authentication', description: 'Require 2FA for all admin accounts', enabled: true, category: 'Authentication' },
    { id: '2', name: 'Session Timeout', description: 'Automatically log out inactive users after 30 minutes', enabled: true, category: 'Session' },
    { id: '3', name: 'IP Whitelisting', description: 'Restrict admin access to approved IP addresses', enabled: false, category: 'Access' },
    { id: '4', name: 'Brute Force Protection', description: 'Block IPs after 5 failed login attempts', enabled: true, category: 'Security' },
    { id: '5', name: 'Rate Limiting', description: 'Limit API requests per minute', enabled: true, category: 'API' },
    { id: '6', name: 'Audit Logging', description: 'Log all admin actions for review', enabled: true, category: 'Monitoring' },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
    toast.success('Security setting updated');
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'failed_login': return <XCircle className="w-5 h-5 text-yellow-400" />;
      case 'suspicious': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'blocked': return <Shield className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const stats = [
    { label: 'Security Score', value: `${securityScore}%`, icon: Shield, color: securityScore >= 80 ? 'text-green-400' : 'text-yellow-400' },
    { label: 'Active Sessions', value: '24', icon: Users, color: 'text-primary' },
    { label: 'Blocked Attempts', value: '156', icon: Lock, color: 'text-red-400' },
    { label: 'Alerts Today', value: '3', icon: AlertTriangle, color: 'text-orange-400' },
  ];

  return (
    <div className="p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Security Center
        </h1>
        <p className="text-muted-foreground mt-1">Monitor and manage platform security</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <motion.div
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Security Settings
          </h2>
          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
              >
                <div className="flex-1">
                  <p className="font-medium">{setting.name}</p>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => toggleSetting(setting.id)}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Security Events */}
        <motion.div
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Recent Security Events
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/50"
              >
                {getEventIcon(event.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{event.user}</p>
                    <span className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.details}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {event.ip}
                    </span>
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Security Recommendations */}
      <motion.div
        className="glass rounded-2xl p-6 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          Security Recommendations
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <Key className="w-5 h-5 text-orange-400" />
            <div className="flex-1">
              <p className="font-medium">Enable IP Whitelisting</p>
              <p className="text-sm text-muted-foreground">Restrict admin access to known IP addresses for enhanced security</p>
            </div>
            <Button size="sm">Enable</Button>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="font-medium">Two-Factor Authentication Active</p>
              <p className="text-sm text-muted-foreground">All admin accounts are protected with 2FA</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SecurityCenter;