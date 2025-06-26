import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export class StripeService {
  async createCheckoutSession(priceId: string, userId: string) {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      const session = await response.json();
      
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  async createPortalSession(customerId: string) {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });

      const session = await response.json();
      window.location.href = session.url;
    } catch (error) {
      console.error('Stripe portal error:', error);
      throw new Error('Failed to create portal session');
    }
  }

  async getSubscriptionStatus(userId: string) {
    try {
      const response = await fetch(`/api/subscription-status/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Subscription status error:', error);
      return { status: 'inactive' };
    }
  }
}

export const stripeService = new StripeService();