import React, { useState } from 'react';
import { Check, Star, Zap, Crown, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { stripeService } from '../../services/stripeService';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Perfect for trying out our AI travel assistant',
    icon: Star,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
    priceId: null,
    features: [
      '3 trips per month',
      'Basic AI chat support',
      'Standard itinerary generation',
      'Basic maps integration',
      'Email support',
    ],
    limitations: [
      'Limited to 3 trips per month',
      'Basic features only',
      'No priority support',
    ],
  },
  {
    name: 'Pro',
    price: 19,
    period: 'month',
    description: 'Everything you need for unlimited travel planning',
    icon: Crown,
    color: 'text-primary-600',
    bgColor: 'bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20',
    borderColor: 'border-primary-200 dark:border-primary-700',
    popular: true,
    priceId: 'price_1234567890', // This would be your actual Stripe price ID
    features: [
      'Unlimited trips',
      'Advanced AI with real-time data',
      'Premium itinerary generation',
      'Advanced maps with safety alerts',
      'PDF export & trip sharing',
      'Real-time flight & hotel prices',
      'Weather forecasts & safety alerts',
      'Priority email & chat support',
      'Collaboration with friends',
      'Custom branding for shared trips',
    ],
    limitations: [],
  },
];

export const PricingPage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: typeof plans[0]) => {
    if (!user) return;

    setIsLoading(plan.name);

    try {
      if (plan.name === 'Pro' && plan.priceId) {
        // Use Stripe for Pro plan
        await stripeService.createCheckoutSession(plan.priceId, user.id);
      } else if (plan.name === 'Free') {
        // Handle free plan downgrade
        await updateProfile({ plan: 'free' });
        alert('Successfully switched to Free plan');
      }
    } catch (error) {
      console.error('Plan change failed:', error);
      alert('Plan change failed. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.stripeCustomerId) return;

    try {
      await stripeService.createPortalSession(user.stripeCustomerId);
    } catch (error) {
      console.error('Portal session failed:', error);
      alert('Unable to open billing portal. Please contact support.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Start planning amazing trips with our AI-powered travel assistant. 
          Upgrade anytime to unlock premium features and unlimited planning.
        </p>
        <div className="mt-6 inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-4 py-2 rounded-full text-sm">
          <Zap className="w-4 h-4" />
          <span>Powered by Gemini AI with real-time data</span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = user?.plan === plan.name.toLowerCase();
          const isLoadingPlan = isLoading === plan.name;
          
          return (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg ${
                plan.popular 
                  ? 'border-primary-300 dark:border-primary-600 shadow-lg transform hover:scale-105' 
                  : plan.borderColor
              } ${plan.bgColor}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Icon className={`w-6 h-6 ${plan.popular ? 'text-white' : plan.color}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /{plan.period}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular 
                        ? 'bg-primary-100 dark:bg-primary-900/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Check className={`w-3 h-3 ${
                        plan.popular 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrentPlan || isLoadingPlan}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isCurrentPlan
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white transform hover:scale-105'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {isLoadingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isCurrentPlan ? (
                  <span>Current Plan</span>
                ) : plan.price === 0 ? (
                  <span>Get Started</span>
                ) : (
                  <span>Upgrade to Pro</span>
                )}
              </button>

              {isCurrentPlan && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    <Check className="w-3 h-3 mr-1" />
                    Active Plan
                  </span>
                  {user?.plan === 'pro' && (
                    <button
                      onClick={handleManageSubscription}
                      className="block w-full mt-2 text-sm text-primary-600 hover:text-primary-500 underline"
                    >
                      Manage Subscription
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          What Makes TravelHelperAI Special?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Real-Time Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Live flight prices, hotel availability, weather forecasts, and safety alerts
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              AI-Powered
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Advanced Gemini AI understands your preferences and creates personalized itineraries
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Complete Solution
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              From planning to booking, maps to safety alerts - everything in one place
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              How does the AI travel assistant work?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our AI is powered by Google's Gemini model and integrates with real-time travel APIs. It learns from your preferences and creates personalized itineraries with live data on flights, hotels, restaurants, weather, and safety information.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Can I cancel my subscription anytime?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, you can cancel your Pro subscription at any time through the billing portal. You'll continue to have access to Pro features until the end of your billing period.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              What happens to my trips if I downgrade?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All your existing trips will remain accessible. However, you'll be limited to creating 3 new trips per month on the free plan, and some premium features will be disabled.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Is my payment information secure?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, all payments are processed securely through Stripe, a PCI-compliant payment processor. We never store your payment information on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Start Planning?
        </h2>
        <p className="text-xl opacity-90 mb-6">
          Join thousands of travelers who trust TravelHelperAI for their adventures.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm opacity-90">
          <span>✓ Real-time data</span>
          <span>✓ AI-powered</span>
          <span>✓ Secure payments</span>
          <span>✓ 30-day guarantee</span>
        </div>
      </div>
    </div>
  );
};