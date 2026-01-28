import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Copy, Eye, EyeOff, Plus, Trash2, RefreshCw, Shield, Globe, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  lastUsed: Date | null;
  isActive: boolean;
}

const APIManagement = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production API',
      key: 'sk_live_xxxxxxxxxxxxxxxxxxxxx',
      permissions: ['read', 'write'],
      createdAt: new Date('2024-01-15'),
      lastUsed: new Date(),
      isActive: true,
    },
    {
      id: '2',
      name: 'Development API',
      key: 'sk_test_xxxxxxxxxxxxxxxxxxxxx',
      permissions: ['read'],
      createdAt: new Date('2024-02-10'),
      lastUsed: null,
      isActive: true,
    }
  ]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };

  const createNewKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }
    const newKey: APIKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `sk_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`,
      permissions: ['read'],
      createdAt: new Date(),
      lastUsed: null,
      isActive: true,
    };
    setApiKeys(prev => [...prev, newKey]);
    setNewKeyName('');
    setShowCreateModal(false);
    toast.success('New API key created');
  };

  const deleteKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    toast.success('API key deleted');
  };

  const toggleKeyStatus = (id: string) => {
    setApiKeys(prev => prev.map(k => 
      k.id === id ? { ...k, isActive: !k.isActive } : k
    ));
    toast.success('API key status updated');
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
              <Key className="w-8 h-8 text-primary" />
              API Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage your API keys and access tokens</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Key
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Keys', value: apiKeys.length, icon: Key },
          { label: 'Active', value: apiKeys.filter(k => k.isActive).length, icon: CheckCircle2 },
          { label: 'API Calls Today', value: '12,456', icon: Globe },
          { label: 'Rate Limit', value: '1000/min', icon: Shield },
        ].map((stat, i) => (
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

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((key, index) => (
          <motion.div
            key={key.id}
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {key.name}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${key.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {key.isActive ? 'Active' : 'Inactive'}
                  </span>
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created: {key.createdAt.toLocaleDateString()}
                  </span>
                  {key.lastUsed && (
                    <span>Last used: {key.lastUsed.toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleKeyStatus(key.id)}
                >
                  {key.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteKey(key.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <code className="flex-1 font-mono text-sm truncate">
                {visibleKeys.has(key.id) ? key.key : '•'.repeat(32)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleKeyVisibility(key.id)}
              >
                {visibleKeys.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(key.key)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2 mt-3">
              {key.permissions.map(p => (
                <span key={p} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-background rounded-2xl p-6 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-xl font-bold mb-4">Create New API Key</h2>
            <Input
              placeholder="API Key Name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={createNewKey} className="flex-1">
                Create Key
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default APIManagement;