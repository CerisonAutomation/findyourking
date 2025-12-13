'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';

interface SubscriptionPlan {
  id: 'free' | 'premium' | 'platinum';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    icon: <Star className="h-6 w-6" />,
    color: 'from-gray-500 to-gray-600',
    features: [
      'Create profile',
      'Browse basic profiles',
      'Send 5 messages per day',
      'Basic search filters',
      'Community access'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29,
    period: 'month',
    description: 'Enhanced experience with premium features',
    icon: <Zap className="h-6 w-6" />,
    color: 'from-blue-500 to-indigo-500',
    popular: true,
    features: [
      'Everything in Free',
      'Unlimited messages',
      'Advanced search & filters',
      'See who viewed your profile',
      'Priority in search results',
      'Read receipts',
      '24/7 customer support'
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: 99,
    period: 'month',
    description: 'Ultimate luxury experience',
    icon: <Crown className="h-6 w-6" />,
    color: 'from-yellow-500 to-orange-500',
    features: [
      'Everything in Premium',
      'VIP profile badge',
      'Top of search results',
      'Advanced matching algorithm',
      'Priority booking requests',
      'Exclusive events access',
      'Personal concierge service',
      'Profile optimization assistance'
    ]
  }
];

interface SubscriptionSelectionProps {
  onSelectPlan: (planId: 'free' | 'premium' | 'platinum') => void;
  selectedPlan?: 'free' | 'premium' | 'platinum';
  onSkip?: () => void;
}

export function SubscriptionSelection({ onSelectPlan, selectedPlan, onSkip }: SubscriptionSelectionProps) {
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select the perfect plan for your FYKING.MEN experience
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg">
          <Button
            variant={billingCycle === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingCycle('month')}
            className="rounded-md"
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'year' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingCycle('year')}
            className="rounded-md"
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 20%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPlan === plan.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            } ${plan.popular ? 'border-primary/50' : ''}`}
            onClick={() => onSelectPlan(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${plan.color}`}>
                {plan.icon}
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                {plan.name}
                {selectedPlan === plan.id && <Badge variant="secondary">Selected</Badge>}
              </CardTitle>
              <div className="space-y-1">
                <div className="text-3xl font-bold">
                  ${billingCycle === 'year' && plan.price > 0 ? Math.round(plan.price * 12 * 0.8) : plan.price}
                  {plan.price > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{billingCycle === 'year' ? 'year' : 'mo'}
                    </span>
                  )}
                </div>
                {billingCycle === 'year' && plan.price > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ${plan.price}/month billed annually
                  </p>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={selectedPlan === plan.id ? 'default' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlan(plan.id);
                }}
              >
                {plan.price === 0 ? 'Get Started Free' : `Choose ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            You selected: <span className="font-semibold">{plans.find(p => p.id === selectedPlan)?.name}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            You can change your plan anytime from your account settings.
          </p>
        </div>
      )}

      {onSkip && (
        <div className="text-center pt-4">
          <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
            Continue with Free Plan
          </Button>
        </div>
      )}
    </div>
  );
}