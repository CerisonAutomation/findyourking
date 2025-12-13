'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const interestsList = [
  'Art', 'Design', 'Photography', 'Fashion', 'Music', 'Writing', 'Reading', 
  'Film', 'Gaming', 'Cooking', 'Baking', 'Mixology', 'Dancing', 'Yoga', 
  'Fitness', 'Running', 'Hiking', 'Skiing', 'Snowboarding', 'Surfing', 
  'Sailing', 'Travel', 'Volunteering', 'Activism', 'Politics', 'History', 
  'Science', 'Technology', 'Entrepreneurship', 'Startups', 'Investing', 'Crypto',
  'Spirituality', 'Meditation', 'Astrology', 'Tarot'
];

const tribesList = [
  'Twink', 'Jock', 'Bear', 'Otter', 'Cub', 'Chub', 'Geek', 'Nerd', 'Daddy', 'Silver Fox',
  'Leather', 'Pup', 'Drag', 'Queer', 'Trans', 'Non-Binary', 'Sober', 'Poz', 'Discreet'
];


export function FilterDialog({ setFilters }: { setFilters: (filters: any) => void }) {
  const [ageRange, setAgeRange] = useState([18, 65]);
  const [distance, setDistance] = useState(50);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleTribeToggle = (tribe: string) => {
    setSelectedTribes((prev) =>
      prev.includes(tribe) ? prev.filter((t) => t !== tribe) : [...prev, tribe]
    );
  };
  
  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleReset = () => {
    setAgeRange([18, 65]);
    setDistance(50);
    setSelectedTribes([]);
    setSelectedInterests([]);
  };

  const handleSave = () => {
    setFilters({ ageRange, distance, tribes: selectedTribes, interests: selectedInterests });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Filters</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Profiles</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Age Range: {ageRange[0]} - {ageRange[1]}</Label>
            <Slider
              min={18}
              max={100}
              step={1}
              value={ageRange}
              onValueChange={setAgeRange}
            />
          </div>
          <div className="grid gap-2">
            <Label>Distance: {distance} miles</Label>
            <Slider
              min={1}
              max={500}
              step={1}
              value={[distance]}
              onValueChange={(value) => setDistance(value[0])}
            />
          </div>
          <div className="grid gap-2">
            <Label>Tribes</Label>
            <div className="flex flex-wrap gap-2">
              {tribesList.map((tribe) => (
                <Button
                  key={tribe}
                  variant={selectedTribes.includes(tribe) ? 'secondary' : 'outline'}
                  onClick={() => handleTribeToggle(tribe)}
                  className="h-8 text-sm"
                >
                  {tribe}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2">
              {interestsList.map((interest) => (
                <Button
                  key={interest}
                  variant={selectedInterests.includes(interest) ? 'secondary' : 'outline'}
                  onClick={() => handleInterestToggle(interest)}
                  className="h-8 text-sm"
                >
                  {interest}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={handleReset}>Reset</Button>
            <DialogClose asChild>
                <Button onClick={handleSave}>Save Filters</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
