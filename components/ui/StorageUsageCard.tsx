'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, ImageIcon, MessageSquare, Lock } from 'lucide-react';

interface StorageUsageCardProps {
  profilePhotosBytes: number;
  chatMediaBytes: number;
  privateAlbumsBytes: number;
  totalBytes: number;
  maxStorageMB: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function StorageUsageCard({
  profilePhotosBytes,
  chatMediaBytes,
  privateAlbumsBytes,
  totalBytes,
  maxStorageMB,
}: StorageUsageCardProps) {
  const maxBytes = maxStorageMB * 1024 * 1024;
  const percentUsed = Math.min((totalBytes / maxBytes) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Storage Usage
        </CardTitle>
        <CardDescription>
          {formatBytes(totalBytes)} of {maxStorageMB >= 1024 ? `${(maxStorageMB / 1024).toFixed(1)} GB` : `${maxStorageMB} MB`} used
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {percentUsed.toFixed(1)}% of your storage limit
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Profile Photos</span>
            </div>
            <span className="text-sm font-medium">{formatBytes(profilePhotosBytes)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <span className="text-sm">Chat Media</span>
            </div>
            <span className="text-sm font-medium">{formatBytes(chatMediaBytes)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-500" />
              <span className="text-sm">Private Albums</span>
            </div>
            <span className="text-sm font-medium">{formatBytes(privateAlbumsBytes)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
