'use client';
import Logo from './common/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Package, Truck, CheckCircle, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

const Loading = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    {
      icon: ShoppingBag,
      text: 'Preparing your shopping experience...',
      color: 'text-emerald-600',
      bgGradient: 'from-emerald-500/20 to-emerald-600/20',
      iconBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      icon: Package,
      text: 'Loading fresh products...',
      color: 'text-green-600',
      bgGradient: 'from-green-500/20 to-green-600/20',
      iconBg: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      icon: Truck,
      text: 'Setting up delivery options...',
      color: 'text-orange-600',
      bgGradient: 'from-orange-500/20 to-orange-600/20',
      iconBg: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      icon: CheckCircle,
      text: 'Almost ready!',
      color: 'text-emerald-600',
      bgGradient: 'from-emerald-500/20 to-emerald-600/20',
      iconBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = loadingSteps[currentStep].icon;
  const progress = ((currentStep + 1) / loadingSteps.length) * 100;

  return (
    <div className="fixed inset-0 w-full h-full bg-linear-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gofarm-light-green/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gofarm-orange/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col justify-center items-center gap-10 max-w-md mx-auto px-6">
        {/* Logo with Glow Effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative"
        >
          <motion.div
            className="absolute inset-0 bg-gofarm-light-green/20 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div className="relative z-10">
            <Logo />
          </div>
        </motion.div>

        {/* Main Loading Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 p-8 w-full max-w-sm min-w-100"
        >
          {/* Animated Icon Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
              className="flex justify-center mb-6 h-30 items-center"
            >
              <div className="relative">
                {/* Rotating Ring */}
                <motion.div
                  className={`absolute inset-0 rounded-full bg-linear-to-br ${loadingSteps[currentStep].bgGradient} blur-xl`}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                {/* Icon Container */}
                <div
                  className={`relative p-6 rounded-2xl ${loadingSteps[currentStep].iconBg} border-2 ${loadingSteps[currentStep].borderColor} shadow-lg`}
                >
                  <CurrentIcon
                    className={`w-12 h-12 ${loadingSteps[currentStep].color}`}
                    strokeWidth={2}
                  />

                  {/* Sparkle Effect */}
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-gofarm-orange fill-gofarm-orange" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Loading Text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-3 mb-6"
            >
              <h2 className="text-xl font-bold text-gray-800 min-h-14 flex items-center justify-center">
                {loadingSteps[currentStep].text}
              </h2>
              <p className="text-sm text-gray-500 min-h-5">
                Setting up the best experience for you
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-gofarm-light-green via-gofarm-green to-gofarm-orange rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />

              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Percentage and Step Info */}
            <div className="flex items-center justify-between text-sm">
              <motion.span
                className="font-semibold text-gofarm-green"
                key={progress}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {Math.round(progress)}%
              </motion.span>
              <span className="text-gray-500">
                Step {currentStep + 1} of {loadingSteps.length}
              </span>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-2 mt-6">
            {loadingSteps.map((step, index) => (
              <motion.div
                key={index}
                className={`relative overflow-hidden rounded-full ${
                  index === currentStep ? 'w-8 h-2.5' : 'w-2.5 h-2.5'
                } transition-all duration-500`}
                animate={{
                  backgroundColor:
                    index === currentStep ? '#f97316' : index < currentStep ? '#22c55e' : '#e5e7eb',
                }}
              >
                {index === currentStep && (
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-sm text-gray-500 text-center"
        >
          Powered by <span className="font-semibold text-gofarm-green">GoFarm</span>
        </motion.p>
      </div>
    </div>
  );
};

export default Loading;
