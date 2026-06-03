import { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Crown, Check, Sparkles, Download, Headphones,
  Zap, Gift, Copy, Loader2, ShieldCheck, Sliders, Music2, Infinity as InfinityIcon, Clock,
  Moon, Orbit, Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import PageTransition from '@/components/PageTransition';
import RedeemCodeModal from '@/components/RedeemCodeModal';
import { iosSpring, iosBounce } from '@/lib/animations';
import { usePremium } from '@/hooks/usePremium';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailVerified } from '@/hooks/useEmailVerified';
import { toast } from '@/hooks/use-toast';
import SEOHead from '@/components/SEOHead';

type PlanId = 'monthly' | 'bimonthly' | 'quarterly';

interface UpiSettings {
  monthlyPrice: number;
  bimonthlyPrice: number;
  quarterlyPrice: number;
  upiId: string;
  payeeName: string;
}

const PLAN_LABEL: Record<PlanId, string> = {
  monthly: '1 Month',
  bimonthly: '2 Months',
  quarterly: '3 Months',
};

const FEATURES = [
  { icon: Zap,         title: 'Zero Ads',                desc: 'No pre-rolls, banners or interruptions. Ever.' },
  { icon: Orbit,       title: 'Spatial 3D Audio',        desc: 'Cinema-grade surround that orbits the song around your head — only on Universflow.' },
  { icon: Sliders,     title: '8-Band Studio Equalizer', desc: 'Studio-grade tuning with crafted presets — works on every stream.' },
  { icon: Building2,   title: 'Studio Spaces',           desc: 'Hear songs inside a Vinyl Booth, Cathedral, Stadium and more — a Universflow exclusive nobody else offers.' },
  { icon: Moon,        title: 'Late Night Mode',         desc: 'Lifts whispered details and tames loud peaks so quiet listening still sounds full.' },
  
  { icon: Download,    title: 'Unlimited Downloads',     desc: 'Save anything. Listen offline. Anywhere.' },
  { icon: Music2,      title: 'AI Playlist Generator',   desc: 'Mood-matched playlists, made instantly.' },
  { icon: InfinityIcon, title: 'Crossfade & Gapless',    desc: 'Seamless transitions, end to end.' },
  
  { icon: Sparkles,    title: 'Premium-Only Tracks',     desc: 'Early drops and exclusive releases.' },
  { icon: ShieldCheck, title: 'Priority Support',        desc: 'Skip the line — we answer first.' },
];

interface PendingPayment {
  id: string;
  utr_number: string;
  amount_paise: number;
  plan: string;
  created_at: string;
}

const PremiumPage = memo(function PremiumPage() {
  const navigate = useNavigate();
  const { isPremium, subscription, refetch: refetchPremium } = usePremium();
  const { user } = useAuth();
  const haptics = useHaptics();
  const [showRedeem, setShowRedeem] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('bimonthly');
  const [settings, setSettings] = useState<UpiSettings | null>(null);
  const [pending, setPending] = useState<PendingPayment | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['premium_price_monthly_inr', 'premium_price_bimonthly_inr', 'premium_price_quarterly_inr', 'upi_id', 'upi_payee_name']);
      const map: Record<string, any> = {};
      data?.forEach(r => {
        try { map[r.key] = typeof r.value === 'string' ? JSON.parse(r.value) : r.value; }
        catch { map[r.key] = r.value; }
      });
      setSettings({
        monthlyPrice: Number(map.premium_price_monthly_inr ?? 59),
        bimonthlyPrice: Number(map.premium_price_bimonthly_inr ?? 100),
        quarterlyPrice: Number(map.premium_price_quarterly_inr ?? 149),
        upiId: String(map.upi_id ?? 'yourupi@okaxis'),
        payeeName: String(map.upi_payee_name ?? 'UniversFlow'),
      });
    })();
  }, []);

  // Detect any pending payment request for this user
  useEffect(() => {
    if (!user || isPremium) { setPending(null); return; }
    let cancelled = false;
    const fetchPending = async () => {
      const { data } = await supabase
        .from('payment_requests')
        .select('id, utr_number, amount_paise, plan, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setPending(data ?? null);
    };
    fetchPending();

    // Realtime: react to status updates on payment_requests + subscriptions
    const prChannel = supabase
      .channel(`user-pr-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'payment_requests',
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchPending(); refetchPremium(); })
      .subscribe();

    const subChannel = supabase
      .channel(`user-sub-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_subscriptions',
        filter: `user_id=eq.${user.id}`,
      }, () => { refetchPremium(); fetchPending(); })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(prChannel);
      supabase.removeChannel(subChannel);
    };
  }, [user, isPremium, refetchPremium]);

  const monthly = settings?.monthlyPrice ?? 59;
  const bimonthly = settings?.bimonthlyPrice ?? 100;
  const quarterly = settings?.quarterlyPrice ?? 149;
  const bimonthlyPerMo = (bimonthly / 2).toFixed(0);
  const quarterlyPerMo = (quarterly / 3).toFixed(0);
  const bimonthlySave = Math.max(0, Math.round((1 - (bimonthly / 2) / monthly) * 100));
  const quarterlySave = Math.max(0, Math.round((1 - (quarterly / 3) / monthly) * 100));
  const selectedPrice = selectedPlan === 'quarterly' ? quarterly : selectedPlan === 'bimonthly' ? bimonthly : monthly;

  const handleUpgrade = useCallback(() => {
    haptics.medium();
    setShowCheckout(true);
  }, [haptics]);

  const expiryText = subscription?.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <PageTransition>
      <SEOHead
        title="Univers Flow Premium — Ad-Free Music & Spatial Audio"
        description="Upgrade to Univers Flow Premium for zero ads, spatial 3D audio, studio EQ, unlimited downloads and exclusive tracks."
        keywords="Univers Flow Premium, premium music, ad-free streaming, spatial audio, music download"
        path="/premium"
        jsonLdId="premium-jsonld"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Univers Flow Premium',
            description: 'Ad-free streaming, spatial audio, studio EQ, and unlimited offline downloads.',
            brand: { '@type': 'Brand', name: 'Univers Flow' },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: '99',
              url: 'https://universflow.in/premium',
              availability: 'https://schema.org/InStock',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://universflow.in/' },
              { '@type': 'ListItem', position: 2, name: 'Premium', item: 'https://universflow.in/premium' },
            ],
          },
        ]}
      />
      <motion.div
        className="min-h-screen pb-44 relative overflow-hidden"
        style={{
          background: 'radial-gradient(120% 80% at 50% -10%, #1a1a2e 0%, #0b0b14 55%, #050509 100%)',
          fontFamily: "'Work Sans', system-ui, sans-serif",
          color: '#e8e8f0',
        }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      >
        {/* ─── Static iridescent backdrop (NO heavy moving blurs — perf) ─── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full opacity-50"
            style={{ background: 'radial-gradient(circle, #c4b5fd 0%, transparent 65%)', filter: 'blur(120px)' }}
          />
          <div
            className="absolute top-[42%] -right-32 w-[440px] h-[440px] rounded-full opacity-40"
            style={{ background: 'radial-gradient(circle, #67e8f9 0%, transparent 65%)', filter: 'blur(110px)' }}
          />
          {/* Fine film grain */}
          <div
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style={{
              backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"160\\" height=\\"160\\"><filter id=\\"n\\"><feTurbulence type=\\"fractalNoise\\" baseFrequency=\\"0.9\\" numOctaves=\\"2\\" stitchTiles=\\"stitch\\"/></filter><rect width=\\"100%25\\" height=\\"100%25\\" filter=\\"url(%23n)\\"/></svg>")',
            }}
          />
        </div>

        {/* Header */}
        <motion.header
          className="sticky top-0 z-30 px-2 pt-4 pb-3 flex items-center justify-between"
          style={{
            background: 'linear-gradient(to bottom, rgba(11,11,20,0.85) 0%, rgba(11,11,20,0.55) 100%)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            paddingTop: 'max(16px, env(safe-area-inset-top))',
          }}
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={iosSpring}
        >
          <motion.button
            onClick={() => { haptics.light(); navigate(-1); }}
            className="flex items-center gap-1 px-2 py-2 -ml-1"
            style={{ color: '#c4b5fd' }}
            whileTap={{ scale: 0.95, opacity: 0.7 }} transition={iosBounce}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[15px]" style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 500 }}>Back</span>
          </motion.button>
          <div
            className="text-[10px] tracking-[0.3em] uppercase pr-3"
            style={{ color: 'rgba(232,232,240,0.55)', fontWeight: 500 }}
          >
            Issue 01 · Premium
          </div>
        </motion.header>

        <main className="relative px-5 pt-2">
          {/* ─── EDITORIAL HERO ─── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...iosSpring, delay: 0.05 }}
            className="pt-10 pb-10 relative"
          >
            {/* Eyebrow rule */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(196,181,253,0.5), transparent)' }} />
              <span
                className="text-[10px] tracking-[0.35em] uppercase"
                style={{ color: '#c4b5fd', fontWeight: 600 }}
              >
                A Listening Manifesto
              </span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(196,181,253,0.5), transparent)' }} />
            </div>

            {/* Magazine headline — Instrument Serif italic */}
            <h1
              className="text-center leading-[0.92] tracking-tight mb-6"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(56px, 16vw, 84px)',
                fontWeight: 400,
                color: '#f2f0ff',
              }}
            >
              The way music
              <br />
              <em
                style={{
                  fontStyle: 'italic',
                  background: 'linear-gradient(105deg, #c4b5fd 0%, #67e8f9 50%, #c4b5fd 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                was meant
              </em>
              <br />
              to be heard.
            </h1>

            <p
              className="text-center mx-auto max-w-[300px] text-[14px] leading-[1.55]"
              style={{ color: 'rgba(232,232,240,0.65)', fontWeight: 400 }}
            >
              Studio-grade audio. Zero interruptions.
              <br />
              Built for people who actually listen.
            </p>

            {/* Byline-style trust row */}
            <div className="flex items-center justify-center gap-4 mt-7 text-[10px] tracking-[0.18em] uppercase"
              style={{ color: 'rgba(232,232,240,0.45)' }}
            >
              <span>UPI Secure</span>
              <span style={{ color: '#c4b5fd' }}>•</span>
              <span>Activates in minutes</span>
              <span style={{ color: '#67e8f9' }}>•</span>
              <span>Cancel anytime</span>
            </div>
          </motion.section>

          {/* Active premium banner */}
          {isPremium && (
            <motion.section
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={iosSpring}
              className="rounded-[28px] p-8 text-center relative overflow-hidden mb-10"
              style={{
                background: 'linear-gradient(135deg, rgba(196,181,253,0.12) 0%, rgba(103,232,249,0.08) 100%)',
                border: '0.5px solid rgba(196,181,253,0.35)',
              }}
            >
              <Crown className="w-10 h-10 mx-auto mb-3" style={{ color: '#c4b5fd' }} fill="currentColor" />
              <p
                className="text-[32px] leading-none mb-2"
                style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#f2f0ff' }}
              >
                You're Premium.
              </p>
              {expiryText && (
                <p className="text-[12px] tracking-[0.15em] uppercase" style={{ color: 'rgba(232,232,240,0.55)' }}>
                  Active until {expiryText}
                </p>
              )}
              <button
                onClick={handleUpgrade}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] tracking-[0.15em] uppercase"
                style={{
                  background: 'rgba(196,181,253,0.15)',
                  color: '#c4b5fd',
                  border: '0.5px solid rgba(196,181,253,0.3)',
                  fontWeight: 600,
                }}
              >
                Extend membership
              </button>
            </motion.section>
          )}

          {/* Pending payment banner */}
          {!isPremium && pending && (
            <div className="mb-8">
              <PendingProgressBanner pending={pending} />
            </div>
          )}

          {/* ─── PLAN SECTION ─── */}
          {!isPremium && !pending && (
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...iosSpring, delay: 0.12 }}
              className="mb-12"
            >
              {/* Section masthead */}
              <div className="flex items-baseline justify-between mb-5 px-1">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{ color: '#c4b5fd', fontWeight: 600 }}>
                    Chapter I
                  </p>
                  <h2
                    className="text-[34px] leading-[0.95]"
                    style={{ fontFamily: "'Instrument Serif', serif", color: '#f2f0ff', fontWeight: 400 }}
                  >
                    Choose your <em style={{ fontStyle: 'italic', color: '#c4b5fd' }}>tempo</em>.
                  </h2>
                </div>
                <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(232,232,240,0.4)' }}>
                  03 plans
                </span>
              </div>

              <div className="space-y-3">
                <PlanCard
                  planId="bimonthly"
                  selected={selectedPlan === 'bimonthly'}
                  onSelect={() => { haptics.light(); setSelectedPlan('bimonthly'); }}
                  badge={`Save ${bimonthlySave}%`}
                  title="2 Months"
                  price={bimonthly}
                  perMonth={`₹${bimonthlyPerMo}/mo`}
                  tagline="The sweet spot · 60 days"
                  recommended
                />
                <PlanCard
                  planId="quarterly"
                  selected={selectedPlan === 'quarterly'}
                  onSelect={() => { haptics.light(); setSelectedPlan('quarterly'); }}
                  badge={`Save ${quarterlySave}%`}
                  title="3 Months"
                  price={quarterly}
                  perMonth={`₹${quarterlyPerMo}/mo`}
                  tagline="Best value · 90 days"
                />
                <PlanCard
                  planId="monthly"
                  selected={selectedPlan === 'monthly'}
                  onSelect={() => { haptics.light(); setSelectedPlan('monthly'); }}
                  title="Monthly"
                  price={monthly}
                  perMonth="30 days"
                  tagline="Try it for a month"
                />
              </div>
            </motion.section>
          )}

          {/* ─── FEATURE EDITORIAL ─── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...iosSpring, delay: 0.2 }}
            className="mb-10"
          >
            <div className="mb-6 px-1">
              <p className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{ color: '#67e8f9', fontWeight: 600 }}>
                Chapter II
              </p>
              <h2
                className="text-[34px] leading-[0.95]"
                style={{ fontFamily: "'Instrument Serif', serif", color: '#f2f0ff', fontWeight: 400 }}
              >
                Everything <em style={{ fontStyle: 'italic', color: '#67e8f9' }}>included</em>.
              </h2>
            </div>

            {/* Featured spread — first feature gets hero treatment */}
            {FEATURES[0] && (
              <div
                className="rounded-[24px] p-6 mb-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,181,253,0.12) 0%, rgba(103,232,249,0.06) 100%)',
                  border: '0.5px solid rgba(196,181,253,0.25)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #c4b5fd 0%, #67e8f9 100%)',
                      boxShadow: '0 10px 30px -10px rgba(196,181,253,0.5)',
                    }}
                  >
                    {(() => { const Icon = FEATURES[0].icon; return <Icon className="w-7 h-7" style={{ color: '#0b0b14' }} strokeWidth={2} />; })()}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-[10px] tracking-[0.25em] uppercase mb-1.5" style={{ color: '#c4b5fd', fontWeight: 600 }}>
                      Featured
                    </p>
                    <p
                      className="text-[26px] leading-[1.05] mb-1.5"
                      style={{ fontFamily: "'Instrument Serif', serif", color: '#f2f0ff' }}
                    >
                      {FEATURES[0].title}
                    </p>
                    <p className="text-[13.5px] leading-[1.5]" style={{ color: 'rgba(232,232,240,0.7)' }}>
                      {FEATURES[0].desc}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Remaining features — magazine 2-column grid on small mobile gets staggered */}
            <div className="space-y-2">
              {FEATURES.slice(1).map((f, i) => (
                <motion.article
                  key={f.title}
                  initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ delay: i * 0.03, ...iosSpring }}
                  className="flex items-start gap-4 py-4 px-1 relative"
                  style={{ borderTop: '0.5px solid rgba(196,181,253,0.12)' }}
                >
                  <div
                    className="text-[10px] tabular-nums pt-1 w-6 shrink-0"
                    style={{ color: 'rgba(232,232,240,0.4)', fontFamily: "'Work Sans', sans-serif", letterSpacing: '0.1em' }}
                  >
                    {String(i + 2).padStart(2, '0')}
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(196,181,253,0.08)',
                      border: '0.5px solid rgba(196,181,253,0.18)',
                    }}
                  >
                    <f.icon className="w-4.5 h-4.5" style={{ color: '#c4b5fd', width: 18, height: 18 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[17px] leading-tight mb-1"
                      style={{ fontFamily: "'Instrument Serif', serif", color: '#f2f0ff' }}
                    >
                      {f.title}
                    </p>
                    <p className="text-[12.5px] leading-snug" style={{ color: 'rgba(232,232,240,0.6)' }}>
                      {f.desc}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.section>

          {/* Pull quote */}
          <motion.blockquote
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="my-10 px-2 text-center"
          >
            <p
              className="text-[28px] leading-[1.15]"
              style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#f2f0ff' }}
            >
              <span style={{ color: '#c4b5fd' }}>"</span>
              Most apps play music.
              <br />
              We tried to play it <em style={{ color: '#67e8f9' }}>properly</em>.
              <span style={{ color: '#c4b5fd' }}>"</span>
            </p>
            <p className="text-[10px] tracking-[0.3em] uppercase mt-4" style={{ color: 'rgba(232,232,240,0.45)' }}>
              — The Universflow Team
            </p>
          </motion.blockquote>

          {/* Redeem code link */}
          {!isPremium && !pending && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-center pt-2 pb-4"
            >
              <button
                onClick={() => { haptics.light(); setShowRedeem(true); }}
                className="inline-flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase py-3 px-4"
                style={{ color: '#c4b5fd', fontWeight: 600 }}
              >
                <Gift className="w-3.5 h-3.5" />
                Have a code? Redeem
              </button>
            </motion.div>
          )}
        </main>

        {/* ─── Sticky bottom CTA bar ─── */}
        {!isPremium && !pending && settings && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ ...iosSpring, delay: 0.3 }}
            className="fixed bottom-[68px] left-0 right-0 z-40 px-4 pb-2 pointer-events-none"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
          >
            <div
              className="max-w-md mx-auto rounded-2xl p-3 pointer-events-auto flex items-center gap-3"
              style={{
                background: 'rgba(11,11,20,0.82)',
                border: '0.5px solid rgba(196,181,253,0.25)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                boxShadow: '0 -20px 50px -10px rgba(0,0,0,0.6)',
              }}
            >
              <div className="min-w-0 flex-1 pl-2">
                <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: 'rgba(232,232,240,0.5)' }}>
                  {PLAN_LABEL[selectedPlan]}
                </p>
                <p
                  className="text-[22px] leading-tight"
                  style={{ fontFamily: "'Instrument Serif', serif", color: '#f2f0ff' }}
                >
                  ₹{selectedPrice}
                </p>
              </div>
              <motion.button
                onClick={handleUpgrade}
                whileTap={{ scale: 0.96 }}
                className="px-6 py-3.5 rounded-xl text-[13px] tracking-[0.15em] uppercase flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #c4b5fd 0%, #67e8f9 100%)',
                  color: '#0b0b14',
                  fontWeight: 700,
                  boxShadow: '0 15px 35px -10px rgba(196,181,253,0.55)',
                }}
              >
                Subscribe
                <Sparkles className="w-3.5 h-3.5" fill="currentColor" />
              </motion.button>
            </div>
          </motion.div>
        )}

        <BottomNav />

        <RedeemCodeModal isOpen={showRedeem} onClose={() => setShowRedeem(false)} />

        <AnimatePresence>
          {showCheckout && settings && (
            <UpiCheckoutSheet
              settings={settings}
              plan={selectedPlan}
              onClose={() => setShowCheckout(false)}
              onRedeem={() => { setShowCheckout(false); setShowRedeem(true); }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </PageTransition>
  );
});

// ─────────── Plan card ───────────

interface PlanCardProps {
  planId: PlanId;
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: number;
  perMonth: string;
  tagline: string;
  badge?: string;
  recommended?: boolean;
}

const PlanCard = memo(function PlanCard({
  selected, onSelect, title, price, perMonth, tagline, badge, recommended,
}: PlanCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left rounded-[20px] p-[1px] relative transition-colors"
      style={{
        background: selected
          ? 'linear-gradient(135deg, #c4b5fd 0%, #67e8f9 50%, #c4b5fd 100%)'
          : recommended
          ? 'linear-gradient(135deg, rgba(196,181,253,0.4), rgba(103,232,249,0.3))'
          : 'rgba(196,181,253,0.12)',
        boxShadow: selected
          ? '0 18px 45px -18px rgba(196,181,253,0.5)'
          : 'none',
      }}
    >
      {recommended && (
        <div
          className="absolute -top-2.5 left-5 px-2.5 py-1 rounded-full text-[8.5px] tracking-[0.22em] uppercase z-10 flex items-center gap-1"
          style={{
            background: 'linear-gradient(135deg, #c4b5fd 0%, #67e8f9 100%)',
            color: '#0b0b14',
            fontWeight: 700,
            boxShadow: '0 6px 18px -4px rgba(196,181,253,0.5)',
          }}
        >
          Editor's Pick
        </div>
      )}

      <div
        className="rounded-[19px] px-5 py-5 relative overflow-hidden flex items-center gap-4"
        style={{
          background: selected
            ? 'linear-gradient(135deg, rgba(196,181,253,0.14) 0%, rgba(11,11,20,0.95) 50%, rgba(103,232,249,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(20,20,32,0.85), rgba(11,11,20,0.95))',
        }}
      >
        {/* Selection indicator — minimal radio dot */}
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{
            border: selected ? 'none' : '1px solid rgba(196,181,253,0.35)',
            background: selected ? 'linear-gradient(135deg, #c4b5fd, #67e8f9)' : 'transparent',
          }}
        >
          {selected && <Check className="w-3 h-3" style={{ color: '#0b0b14' }} strokeWidth={3.5} />}
        </div>

        {/* Title & tagline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p
              className="text-[20px] leading-none"
              style={{ fontFamily: "'Instrument Serif', serif", color: '#f2f0ff' }}
            >
              {title}
            </p>
            {badge && (
              <span
                className="text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(103,232,249,0.12)',
                  color: '#67e8f9',
                  border: '0.5px solid rgba(103,232,249,0.3)',
                  fontWeight: 600,
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11.5px] mt-1 tracking-wide" style={{ color: 'rgba(232,232,240,0.5)' }}>
            {tagline}
          </p>
        </div>

        {/* Price — serif numerals */}
        <div className="text-right shrink-0">
          <p
            className="leading-none"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '32px',
              color: '#f2f0ff',
              letterSpacing: '-0.02em',
            }}
          >
            ₹{price}
          </p>
          <p className="text-[10px] mt-1 tracking-[0.1em] uppercase" style={{ color: 'rgba(232,232,240,0.45)' }}>
            {perMonth}
          </p>
        </div>
      </div>
    </motion.button>
  );
});

// ─────────── UPI Checkout Sheet ───────────

interface CheckoutProps {
  settings: UpiSettings;
  plan: PlanId;
  onClose: () => void;
  onRedeem: () => void;
}

type Step = 'pay' | 'confirm' | 'verifying';

const UpiCheckoutSheet = memo(function UpiCheckoutSheet({ settings, plan, onClose, onRedeem }: CheckoutProps) {
  const haptics = useHaptics();
  const { user } = useAuth();
  const { requireVerified } = useEmailVerified();
  const { refetch: refetchPremium } = usePremium();
  const [step, setStep] = useState<Step>('pay');
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);
  const [verifyStage, setVerifyStage] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [activated, setActivated] = useState(false);

  const basePrice = plan === 'quarterly' ? settings.quarterlyPrice : plan === 'bimonthly' ? settings.bimonthlyPrice : settings.monthlyPrice;
  const planLabel = PLAN_LABEL[plan];

  // Unique paise per user (1–99) for auto-matching
  const userPaise = user?.id
    ? (parseInt(user.id.replace(/[^0-9]/g, '').slice(-2) || '7', 10) % 99) + 1
    : 7;
  const amountFinal = `${basePrice}.${String(userPaise).padStart(2, '0')}`;
  const amountPaise = basePrice * 100 + userPaise;

  const upiUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.payeeName)}&am=${amountFinal}&cu=INR&tn=${encodeURIComponent(`Premium-${plan}-${user?.id?.slice(0, 8) ?? ''}`)}`;

  const copyUpi = () => { navigator.clipboard.writeText(settings.upiId); haptics.light(); toast({ title: 'UPI ID copied' }); };
  const copyAmount = () => { navigator.clipboard.writeText(amountFinal); haptics.light(); toast({ title: 'Amount copied' }); };
  const openUpiApp = () => { haptics.medium(); window.location.href = upiUrl; };

  const submitUtr = async () => {
    if (!user) { toast({ title: 'Please sign in first', variant: 'destructive' }); return; }
    if (!requireVerified('submit a payment')) return;
    const cleanUtr = utr.trim();
    if (cleanUtr.length < 6) { toast({ title: 'Enter a valid UTR / transaction ID', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('payment_requests').insert({
        user_id: user.id,
        amount_paise: amountPaise,
        utr_number: cleanUtr,
        status: 'pending',
        plan,
      }).select('id').single();
      if (error) {
        if (error.code === '23505') toast({ title: 'This transaction ID is already submitted', variant: 'destructive' });
        else toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
        setSubmitting(false); return;
      }
      haptics.success();
      setPaymentRequestId(data?.id ?? null);
      setStep('verifying');
      setVerifyStage(1);
      // Fire-and-forget Telegram notification
      supabase.functions.invoke('telegram-notify', {
        body: {
          event: 'payment_submitted',
          email: user.email,
          user_id: user.id,
          plan,
          amount_inr: Math.round(amountPaise / 100),
          utr: cleanUtr,
        },
      }).catch(() => {});
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  // ── Live verification: progress through stages + listen for activation ──
  useEffect(() => {
    if (step !== 'verifying' || !user) return;

    // Animated stage advancement (visual progress while verifying)
    const stageTimers: number[] = [];
    stageTimers.push(window.setTimeout(() => setVerifyStage(s => (s < 2 ? 2 : s)), 1500));
    stageTimers.push(window.setTimeout(() => setVerifyStage(s => (s < 3 ? 3 : s)), 3500));

    // Realtime: payment_requests row changes (admin approving)
    const prChannel = paymentRequestId
      ? supabase
          .channel(`pr-${paymentRequestId}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'payment_requests',
            filter: `id=eq.${paymentRequestId}`,
          }, (payload) => {
            const status = (payload.new as any)?.status;
            if (status === 'approved' || status === 'auto_approved') {
              setVerifyStage(4);
            } else if (status === 'rejected') {
              toast({ title: 'Payment could not be verified', description: 'Please contact support with your UTR.', variant: 'destructive' });
            }
          })
          .subscribe()
      : null;

    // Realtime: subscription becomes active premium
    const subChannel = supabase
      .channel(`sub-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const row = (payload.new as any);
        const isPrem = row?.status === 'active'
          && (row?.subscription_type === 'premium_monthly' || row?.subscription_type === 'premium_yearly');
        if (isPrem) {
          setVerifyStage(4);
          setActivated(true);
          haptics.success();
          refetchPremium();
        }
      })
      .subscribe();

    // Polling fallback (in case realtime is filtered)
    const poll = window.setInterval(async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('status, subscription_type, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();
      const isPrem = data?.status === 'active'
        && (data?.subscription_type === 'premium_monthly' || data?.subscription_type === 'premium_yearly')
        && (!data?.expires_at || new Date(data.expires_at) > new Date());
      if (isPrem) {
        setVerifyStage(4);
        setActivated(true);
        haptics.success();
        refetchPremium();
      }
    }, 5000);

    return () => {
      stageTimers.forEach(t => clearTimeout(t));
      if (prChannel) supabase.removeChannel(prChannel);
      supabase.removeChannel(subChannel);
      clearInterval(poll);
    };
  }, [step, user, paymentRequestId, haptics, refetchPremium]);


  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={iosSpring}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl p-6 pb-10 max-h-[92vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--card)), hsl(var(--background)))',
          border: '0.5px solid hsl(var(--border))',
        }}
      >
        <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-5" />

        {step === 'pay' && (
          <>
            <div className="text-center mb-5">
              <div
                className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
              >
                <Crown className="w-7 h-7 text-primary-foreground" />
              </div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{planLabel} · Premium</p>
              <h3 className="text-[22px] font-bold">Pay ₹{amountFinal}</h3>
              <p className="text-[12px] text-muted-foreground mt-1">
                Unique amount helps us auto-match your payment
              </p>
            </div>

            <div
              className="rounded-2xl p-5 mb-3 text-center"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.12))',
                border: '0.5px solid hsl(var(--primary) / 0.3)',
              }}
            >
              <p className="text-[11px] tracking-widest uppercase text-muted-foreground mb-1">Amount</p>
              <button onClick={copyAmount} className="inline-flex items-center gap-2 group">
                <span className="text-[36px] font-bold tracking-tight">₹{amountFinal}</span>
                <Copy className="w-4 h-4 text-muted-foreground group-active:text-primary" />
              </button>
              <p className="text-[11px] text-muted-foreground mt-1">Tap to copy · Pay this exact amount</p>
            </div>

            <button
              onClick={copyUpi}
              className="w-full rounded-2xl p-4 mb-4 flex items-center justify-between"
              style={{ background: 'hsl(var(--muted) / 0.4)', border: '0.5px solid hsl(var(--border) / 0.5)' }}
            >
              <div className="text-left">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground">UPI ID</p>
                <p className="font-semibold text-[15px] mt-0.5">{settings.upiId}</p>
              </div>
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={openUpiApp}
              className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 mb-3"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                color: 'hsl(var(--primary-foreground))',
                boxShadow: '0 10px 30px -10px hsl(var(--primary) / 0.5)',
              }}
            >
              Open UPI app
            </button>

            <button
              onClick={() => { haptics.light(); setStep('confirm'); }}
              className="w-full py-3.5 rounded-2xl font-semibold text-[15px]"
              style={{ background: 'hsl(var(--muted) / 0.5)', border: '0.5px solid hsl(var(--border) / 0.5)' }}
            >
              I've paid · Submit transaction ID
            </button>

            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={onRedeem}
              className="w-full py-3 text-[14px] font-semibold text-primary flex items-center justify-center gap-1.5"
            >
              <Gift className="w-4 h-4" />
              Redeem a code instead
            </button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <button onClick={() => setStep('pay')} className="text-[14px] text-primary mb-4 flex items-center">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <h3 className="text-[22px] font-bold mb-1">Submit transaction ID</h3>
            <p className="text-[13px] text-muted-foreground mb-5">
              Find the 12-digit UTR / Transaction ID in your UPI app's payment receipt.
            </p>

            <input
              type="text"
              value={utr}
              onChange={e => setUtr(e.target.value)}
              placeholder="e.g. 412345678901"
              autoComplete="off"
              maxLength={30}
              className="w-full px-4 py-4 rounded-2xl text-[16px] font-mono tracking-wider mb-3 bg-transparent outline-none"
              style={{
                background: 'hsl(var(--muted) / 0.4)',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            />

            <div
              className="rounded-2xl p-3 mb-4 text-[12px] leading-relaxed"
              style={{ background: 'hsl(var(--primary) / 0.08)', border: '0.5px solid hsl(var(--primary) / 0.2)' }}
            >
              <p className="text-foreground/80">
                <strong className="text-primary">Auto-verify:</strong> We match the unique amount{' '}
                <strong>(₹{amountFinal})</strong> with your bank UTR. Premium activates within minutes.
              </p>
            </div>

            <button
              onClick={submitUtr}
              disabled={submitting || utr.trim().length < 6}
              className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                color: 'hsl(var(--primary-foreground))',
              }}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit & Activate'}
            </button>
          </>
        )}

        {step === 'verifying' && (
          <SubmittedConfirmation
            activated={activated}
            amount={amountFinal}
            utr={utr}
            onClose={onClose}
          />
        )}
      </motion.div>
    </motion.div>
  );
});

// ─────────── Live verification UI ───────────

interface SubmittedConfirmationProps {
  activated: boolean;
  amount: string;
  utr: string;
  onClose: () => void;
}

/**
 * Sheet confirmation shown right after the user submits a UTR.
 * Closes the sheet and lets the page-level PendingProgressBanner take over.
 */
const SubmittedConfirmation = memo(function SubmittedConfirmation({
  activated, amount, utr, onClose,
}: SubmittedConfirmationProps) {
  if (activated) {
    return (
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={iosBounce}
          className="w-24 h-24 mx-auto mb-5 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
            boxShadow: '0 20px 50px -10px hsl(var(--primary) / 0.6)',
          }}
        >
          <Crown className="w-12 h-12 text-primary-foreground" fill="currentColor" />
        </motion.div>
        <h3 className="text-[26px] font-bold mb-2">You're Premium 🎉</h3>
        <p className="text-[14px] text-muted-foreground mb-6 px-4">
          Premium is now live on your account. Enjoy the upgrade.
        </p>
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold text-[16px]"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          Start listening
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={iosBounce}
        className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--accent) / 0.18))',
          border: '1px solid hsl(var(--primary) / 0.4)',
        }}
      >
        <Check className="w-10 h-10 text-primary" strokeWidth={3} />
      </motion.div>
      <h3 className="text-[22px] font-bold mb-2">Got it — payment received</h3>
      <p className="text-[13.5px] text-muted-foreground mb-1 px-2 leading-relaxed">
        We've recorded your UTR <strong className="text-foreground">{utr.slice(0, 6)}…</strong> for ₹{amount}.
      </p>
      <p className="text-[13px] text-muted-foreground mb-6 px-4 leading-relaxed">
        Verification is now running in the background. You can watch live progress on the Premium page —
        and we'll send a push the moment Premium activates.
      </p>
      <button
        onClick={onClose}
        className="w-full py-4 rounded-2xl font-bold text-[16px]"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          color: 'hsl(var(--primary-foreground))',
        }}
      >
        See live progress
      </button>
    </div>
  );
});

// ─────────── Pending progress banner (shown on /premium when a UTR is awaiting verification) ───────────

interface PendingProgressBannerProps {
  pending: PendingPayment;
}

const PendingProgressBanner = memo(function PendingProgressBanner({ pending }: PendingProgressBannerProps) {
  // Animated stage advancement to feel "live" — caps at stage 3 (last step is activation)
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(pending.created_at).getTime();
    const tick = () => {
      const seconds = Math.floor((Date.now() - start) / 1000);
      setElapsed(seconds);
      if (seconds < 20) setStage(1);
      else if (seconds < 60) setStage(2);
      else setStage(3);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pending.created_at]);

  const amountInr = (pending.amount_paise / 100).toFixed(2);
  const planLabel = (PLAN_LABEL as Record<string, string>)[pending.plan] ?? pending.plan;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const steps = [
    { label: 'Payment received', detail: `UTR ${pending.utr_number.slice(0, 6)}…` },
    { label: 'Verifying with bank', detail: `Matching ₹${amountInr}` },
    { label: 'Activating your Premium', detail: 'Almost there — stay close' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={iosSpring}
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, hsl(var(--primary) / 0.22) 0%, hsl(var(--card)) 60%, hsl(var(--accent) / 0.18) 100%)',
        border: '1px solid hsl(var(--primary) / 0.4)',
        boxShadow: '0 20px 60px -20px hsl(var(--primary) / 0.45)',
      }}
    >
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)', filter: 'blur(30px)' }}
      />

      <div className="flex items-center gap-3 mb-1 relative">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'hsl(var(--primary) / 0.2)' }}
        >
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.22em] text-primary uppercase">
            You're so close
          </p>
          <h2 className="text-[20px] font-bold leading-tight">Activating Premium · {planLabel}</h2>
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground mb-5 relative">
        Your payment of <strong className="text-foreground">₹{amountInr}</strong> is being matched with our bank records.
        This usually takes <strong className="text-foreground">1–2 minutes</strong>.
      </p>

      <div className="space-y-2 mb-4 relative">
        {steps.map((s, idx) => {
          const done = stage > (idx + 1) as any;
          const active = stage === (idx + 1);
          const pendingStep = !done && !active;
          return (
            <div
              key={s.label}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{
                background: active
                  ? 'hsl(var(--primary) / 0.12)'
                  : done
                  ? 'hsl(var(--primary) / 0.06)'
                  : 'hsl(var(--muted) / 0.25)',
                border: `0.5px solid ${active ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border) / 0.4)'}`,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: done
                    ? 'hsl(var(--primary))'
                    : active
                    ? 'hsl(var(--primary) / 0.25)'
                    : 'hsl(var(--muted) / 0.6)',
                }}
              >
                {done ? (
                  <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
                ) : active ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                ) : (
                  <span className="text-[10px] text-muted-foreground font-bold">{idx + 1}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] font-semibold ${pendingStep ? 'text-muted-foreground' : ''}`}>
                  {s.label}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{s.detail}</p>
              </div>
              {active && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        className="rounded-2xl p-3 flex items-center gap-2 relative"
        style={{ background: 'hsl(var(--background) / 0.5)', border: '0.5px solid hsl(var(--border) / 0.5)' }}
      >
        <Clock className="w-4 h-4 text-primary shrink-0" />
        <p className="text-[12px] text-foreground/80 flex-1">
          Waiting <strong className="text-foreground">{mins > 0 ? `${mins}m ` : ''}{secs}s</strong> · You'll get a push notification the instant it's live.
        </p>
        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
      </div>
    </motion.section>
  );
});

export default PremiumPage;
