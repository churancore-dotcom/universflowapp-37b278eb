import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Users, Clock, Target, BarChart3, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  body: string;
  targetAudience: 'all' | 'premium' | 'free' | 'inactive';
  scheduledAt: Date | null;
  status: 'draft' | 'scheduled' | 'sent';
  sentCount: number;
  clickCount: number;
  createdAt: Date;
}

const PushNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Music Alert! 🎵',
      body: 'Check out the latest releases from your favorite artists',
      targetAudience: 'all',
      scheduledAt: null,
      status: 'sent',
      sentCount: 15420,
      clickCount: 3245,
      createdAt: new Date('2024-01-20'),
    },
    {
      id: '2',
      title: 'Premium Sale - 50% Off!',
      body: 'Upgrade to Premium today and get unlimited access',
      targetAudience: 'free',
      scheduledAt: new Date('2024-02-01'),
      status: 'scheduled',
      sentCount: 0,
      clickCount: 0,
      createdAt: new Date('2024-01-25'),
    }
  ]);

  const [showCompose, setShowCompose] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    body: '',
    targetAudience: 'all' as const,
  });

  const handleSend = () => {
    if (!newNotification.title || !newNotification.body) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const notification: Notification = {
      id: Date.now().toString(),
      ...newNotification,
      scheduledAt: null,
      status: 'sent',
      sentCount: Math.floor(Math.random() * 10000),
      clickCount: 0,
      createdAt: new Date(),
    };
    
    setNotifications(prev => [notification, ...prev]);
    setNewNotification({ title: '', body: '', targetAudience: 'all' });
    setShowCompose(false);
    toast.success('Push notification sent successfully!');
  };

  const stats = [
    { label: 'Total Sent', value: notifications.reduce((acc, n) => acc + n.sentCount, 0).toLocaleString(), icon: Send },
    { label: 'Total Clicks', value: notifications.reduce((acc, n) => acc + n.clickCount, 0).toLocaleString(), icon: Target },
    { label: 'Avg CTR', value: '21.3%', icon: BarChart3 },
    { label: 'Scheduled', value: notifications.filter(n => n.status === 'scheduled').length, icon: Clock },
  ];

  const audienceLabels = {
    all: 'All Users',
    premium: 'Premium Only',
    free: 'Free Users',
    inactive: 'Inactive Users',
  };

  return (
    <div className="p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Push Notifications
            </h1>
            <p className="text-muted-foreground mt-1">Send and manage push notifications to your users</p>
          </div>
          <Button onClick={() => setShowCompose(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Notification
          </Button>
        </div>
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
            <stat.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <motion.div
          className="glass rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Compose Notification
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                placeholder="Notification title"
                value={newNotification.title}
                onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message</label>
              <Textarea
                placeholder="Notification message"
                value={newNotification.body}
                onChange={(e) => setNewNotification(prev => ({ ...prev, body: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Target Audience</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(audienceLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setNewNotification(prev => ({ ...prev, targetAudience: key as any }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      newNotification.targetAudience === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCompose(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSend} className="flex-1 gap-2">
                <Send className="w-4 h-4" />
                Send Now
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notification History */}
      <div>
        <h2 className="text-xl font-bold mb-4">Notification History</h2>
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              className="glass rounded-2xl p-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{notification.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{notification.body}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  notification.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                  notification.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {notification.status}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {audienceLabels[notification.targetAudience]}
                </span>
                {notification.status === 'sent' && (
                  <>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Send className="w-4 h-4" />
                      {notification.sentCount.toLocaleString()} sent
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Target className="w-4 h-4" />
                      {notification.clickCount.toLocaleString()} clicks
                    </span>
                    <span className="text-primary font-medium">
                      {((notification.clickCount / notification.sentCount) * 100).toFixed(1)}% CTR
                    </span>
                  </>
                )}
                {notification.scheduledAt && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Scheduled: {notification.scheduledAt.toLocaleDateString()}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PushNotifications;