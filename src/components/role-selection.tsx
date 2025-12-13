'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Briefcase, Users, ArrowRight } from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (role: 'seeker' | 'provider') => void;
  selectedRole?: 'seeker' | 'provider';
}

export function RoleSelection({ onSelectRole, selectedRole }: RoleSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Role</h2>
        <p className="text-muted-foreground">
          Select how you'd like to use FYKING.MEN
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Seeker Role */}
        <Card
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedRole === 'seeker'
              ? 'ring-2 ring-primary border-primary'
              : 'hover:border-primary/50'
          }`}
          onClick={() => onSelectRole('seeker')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              Seeker
              {selectedRole === 'seeker' && <Badge variant="secondary">Selected</Badge>}
            </CardTitle>
            <CardDescription>
              Find meaningful connections and discreet encounters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Browse profiles and connect</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span>Save favorites and matches</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span>Book premium experiences</span>
              </div>
            </div>
            <Button
              className="w-full"
              variant={selectedRole === 'seeker' ? 'default' : 'outline'}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('seeker');
              }}
            >
              Choose Seeker
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Provider Role */}
        <Card
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedRole === 'provider'
              ? 'ring-2 ring-primary border-primary'
              : 'hover:border-primary/50'
          }`}
          onClick={() => onSelectRole('provider')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              Provider
              {selectedRole === 'provider' && <Badge variant="secondary">Selected</Badge>}
            </CardTitle>
            <CardDescription>
              Offer premium companionship and experiences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Showcase your profile</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span>Set your rates and availability</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span>Manage bookings and clients</span>
              </div>
            </div>
            <Button
              className="w-full"
              variant={selectedRole === 'provider' ? 'default' : 'outline'}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('provider');
              }}
            >
              Choose Provider
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {selectedRole && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            You selected: <span className="font-semibold capitalize">{selectedRole}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            You can change your role later in your account settings.
          </p>
        </div>
      )}
    </div>
  );
}