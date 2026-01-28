import { useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Play, Pause, Plus, BarChart3, Users, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  variants: {
    name: string;
    traffic: number;
    conversions: number;
    users: number;
  }[];
  winner?: string;
}

const ABTesting = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([
    {
      id: '1',
      name: 'Premium CTA Button Color',
      description: 'Testing different colors for the premium upgrade button',
      status: 'running',
      startDate: new Date('2024-01-15'),
      variants: [
        { name: 'Control (Blue)', traffic: 50, conversions: 234, users: 5420 },
        { name: 'Variant A (Green)', traffic: 50, conversions: 289, users: 5380 },
      ],
    },
    {
      id: '2',
      name: 'Onboarding Flow',
      description: 'Testing simplified vs detailed onboarding',
      status: 'completed',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-14'),
      variants: [
        { name: 'Control (Detailed)', traffic: 50, conversions: 1234, users: 4500 },
        { name: 'Variant A (Simple)', traffic: 50, conversions: 1567, users: 4520 },
      ],
      winner: 'Variant A (Simple)',
    },
    {
      id: '3',
      name: 'Mini Player Position',
      description: 'Testing bottom vs floating mini player',
      status: 'paused',
      startDate: new Date('2024-01-20'),
      variants: [
        { name: 'Control (Bottom)', traffic: 50, conversions: 890, users: 3200 },
        { name: 'Variant A (Floating)', traffic: 50, conversions: 845, users: 3180 },
      ],
    }
  ]);

  const [showCreate, setShowCreate] = useState(false);

  const toggleExperiment = (id: string) => {
    setExperiments(prev => prev.map(exp => {
      if (exp.id === id) {
        const newStatus = exp.status === 'running' ? 'paused' : 'running';
        toast.success(`Experiment ${newStatus === 'running' ? 'resumed' : 'paused'}`);
        return { ...exp, status: newStatus };
      }
      return exp;
    }));
  };

  const getConversionRate = (conversions: number, users: number) => {
    return ((conversions / users) * 100).toFixed(2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500/20 text-green-400';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const stats = [
    { label: 'Active Experiments', value: experiments.filter(e => e.status === 'running').length, icon: Play },
    { label: 'Total Experiments', value: experiments.length, icon: FlaskConical },
    { label: 'Users in Tests', value: experiments.reduce((acc, e) => acc + e.variants.reduce((a, v) => a + v.users, 0), 0).toLocaleString(), icon: Users },
    { label: 'Completed', value: experiments.filter(e => e.status === 'completed').length, icon: CheckCircle2 },
  ];

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
              <FlaskConical className="w-8 h-8 text-primary" />
              A/B Testing
            </h1>
            <p className="text-muted-foreground mt-1">Run experiments to optimize your app</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Experiment
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

      {/* Experiments List */}
      <div className="space-y-6">
        {experiments.map((experiment, index) => (
          <motion.div
            key={experiment.id}
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg">{experiment.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(experiment.status)}`}>
                    {experiment.status}
                  </span>
                  {experiment.winner && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      <Trophy className="w-3 h-3" />
                      Winner: {experiment.winner}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{experiment.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Started: {experiment.startDate.toLocaleDateString()}
                  {experiment.endDate && ` • Ended: ${experiment.endDate.toLocaleDateString()}`}
                </p>
              </div>
              {experiment.status !== 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExperiment(experiment.id)}
                  className="gap-2"
                >
                  {experiment.status === 'running' ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Variants */}
            <div className="space-y-4">
              {experiment.variants.map((variant, vi) => {
                const conversionRate = getConversionRate(variant.conversions, variant.users);
                const isWinner = experiment.winner === variant.name;
                const maxConversion = Math.max(...experiment.variants.map(v => parseFloat(getConversionRate(v.conversions, v.users))));
                const isLeading = parseFloat(conversionRate) === maxConversion && experiment.status === 'running';
                
                return (
                  <div
                    key={vi}
                    className={`p-4 rounded-xl ${isWinner ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/50'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{variant.name}</span>
                        {isLeading && !experiment.winner && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Leading</span>
                        )}
                        {isWinner && (
                          <Trophy className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{variant.traffic}% traffic</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{variant.users.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Users</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{variant.conversions.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Conversions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{conversionRate}%</p>
                        <p className="text-xs text-muted-foreground">Conversion Rate</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Progress value={parseFloat(conversionRate) * 10} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Statistical Significance */}
            {experiment.status === 'running' && (
              <div className="mt-4 p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Statistical Significance: 87%</p>
                  <p className="text-xs text-muted-foreground">Need 95% confidence to declare a winner</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ABTesting;