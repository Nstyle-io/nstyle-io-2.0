import React, { useState } from 'react';
import { Globe, Users, Lock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type PostVisibility = 'public' | 'followers' | 'private' | 'custom';

interface PrivacySelectorProps {
  value: PostVisibility;
  onChange: (value: PostVisibility) => void;
  allowedUsers?: string[];
  onAllowedUsersChange?: (users: string[]) => void;
}

export const PrivacySelector: React.FC<PrivacySelectorProps> = ({
  value,
  onChange,
  allowedUsers: _allowedUsers = [],
  onAllowedUsersChange: _onAllowedUsersChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const privacyOptions = [
    {
      value: 'public' as PostVisibility,
      icon: Globe,
      label: 'Public',
      description: 'Everyone can see this post'
    },
    {
      value: 'followers' as PostVisibility,
      icon: Users,
      label: 'Followers',
      description: 'Only your followers can see this'
    },
    {
      value: 'private' as PostVisibility,
      icon: Lock,
      label: 'Only me',
      description: 'Only you can see this post'
    },
    {
      value: 'custom' as PostVisibility,
      icon: Settings,
      label: 'Custom',
      description: 'Choose specific people'
    }
  ];

  const selectedOption = privacyOptions.find(option => option.value === value);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 justify-start">
          {selectedOption && (
            <>
              <selectedOption.icon className="w-4 h-4" />
              {selectedOption.label}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm mb-3">Who can see this?</h4>
              {privacyOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    value === option.value
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    if (option.value !== 'custom') {
                      setIsOpen(false);
                    }
                  }}
                >
                  <option.icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  {value === option.value && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  )}
                </div>
              ))}
              
              {value === 'custom' && (
                <div className="mt-4 p-3 border-t">
                  <p className="text-sm font-medium mb-2">Select people:</p>
                  <p className="text-xs text-muted-foreground">
                    Custom user selection will be available in the next update
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};