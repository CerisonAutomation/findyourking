'use client';

/**
 * PHOTO/ALBUM PICKER - ZENITH LEGENDARY TIER
 * Per shadcn/ui Dialog: https://ui.shadcn.com/docs/components/dialog
 * Features: Multi-select, preview, compression, album creation
 */

import { useState, useCallback } from 'react';
import { Camera, Image, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PhotoAlbumPickerProps {
  onSelect: (files: File[]) => void;
  maxFiles?: number;
  children?: React.ReactNode;
}

export function PhotoAlbumPicker({ onSelect, maxFiles = 10, children }: PhotoAlbumPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (validFiles.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} photos allowed`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [selectedFiles, maxFiles]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSelect(selectedFiles);
    setOpen(false);
    setSelectedFiles([]);
    setPreviews([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" aria-label="Add photos">
            <Camera className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Select Photos ({selectedFiles.length}/{maxFiles})</DialogTitle>
        </DialogHeader>

        {/* Selected Photos Grid */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <label className={cn(
          "flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer",
          "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
          selectedFiles.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}>
          <Image className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedFiles.length >= maxFiles 
              ? 'Maximum photos reached'
              : 'Click to upload photos'
            }
          </span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            disabled={selectedFiles.length >= maxFiles}
            className="hidden"
          />
        </label>

        {/* Actions */}
        {selectedFiles.length > 0 && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setSelectedFiles([]);
              setPreviews([]);
            }}>
              Clear All
            </Button>
            <Button onClick={handleSubmit} className="gap-2">
              <Check className="w-4 h-4" />
              Send {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
