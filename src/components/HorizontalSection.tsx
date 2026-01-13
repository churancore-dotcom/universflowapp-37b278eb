import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';
import { iosSpring, staggerContainer } from '@/lib/animations';

interface HorizontalSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onSeeAll?: () => void;
}

const HorizontalSection = ({ title, subtitle, children, onSeeAll }: HorizontalSectionProps) => {
  return (
    <motion.section
      className="mb-10"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={iosSpring}
    >
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <motion.h2 
            className="text-[22px] md:text-2xl font-semibold tracking-tight"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ ...iosSpring, delay: 0.1 }}
          >
            {title}
          </motion.h2>
          {subtitle && (
            <motion.p 
              className="text-sm text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        {onSeeAll && (
          <motion.button
            className="flex items-center gap-1 text-sm text-primary font-medium"
            onClick={onSeeAll}
            whileHover={{ x: 4, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={iosSpring}
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
      
      <motion.div 
        className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory -mx-6 px-6"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {children}
      </motion.div>
    </motion.section>
  );
};

export default HorizontalSection;
