'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Target, PiggyBank, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

export function WelcomeStep({ onNext }) {
  const { t, isRTL } = useI18n()

  const features = [
    {
      icon: TrendingUp,
      text: t('onboarding.welcome.feature1'),
      color: 'from-emerald-400 to-green-500',
    },
    {
      icon: Target,
      text: t('onboarding.welcome.feature2'),
      color: 'from-blue-400 to-indigo-500',
    },
    {
      icon: PiggyBank,
      text: t('onboarding.welcome.feature3'),
      color: 'from-purple-400 to-pink-500',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-center"
    >
      {/* Logo Animation */}
      <motion.div
        variants={itemVariants}
        className="mb-8"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="relative inline-flex"
        >
          <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-3xl bg-gradient-to-br from-light-accent to-blue-600 dark:from-dark-accent dark:to-blue-500 flex items-center justify-center shadow-2xl shadow-light-accent/30 dark:shadow-dark-accent/30">
            <span className="text-5xl lg:text-6xl font-bold text-white">M</span>
          </div>
          {/* Sparkle effects */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            className="absolute -bottom-1 -left-2"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Welcome Text */}
      <motion.div variants={itemVariants} className="mb-2">
        <span className="text-lg font-medium text-light-accent dark:text-dark-accent">
          {t('onboarding.welcome.greeting')}
        </span>
      </motion.div>

      <motion.h1
        variants={itemVariants}
        className="text-4xl lg:text-5xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4"
      >
        Monity
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-lg text-light-text-secondary dark:text-dark-text-secondary mb-10 max-w-sm mx-auto leading-relaxed"
      >
        {t('onboarding.welcome.subtitle')}
      </motion.p>

      {/* Features */}
      <motion.div
        variants={containerVariants}
        className="space-y-4 mb-10"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="flex items-center gap-4 p-4 rounded-2xl bg-light-elevated/80 dark:bg-dark-elevated/80 backdrop-blur-sm border border-light-border/50 dark:border-dark-border/50"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-light-text-primary dark:text-dark-text-primary font-medium text-start">
              {feature.text}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Button */}
      <motion.button
        variants={itemVariants}
        onClick={onNext}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-light-accent to-blue-600 dark:from-dark-accent dark:to-blue-500 text-white font-semibold text-lg shadow-xl shadow-light-accent/30 dark:shadow-dark-accent/30 flex items-center justify-center gap-2 group"
      >
        {t('onboarding.welcome.cta')}
        <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
      </motion.button>
    </motion.div>
  )
}

