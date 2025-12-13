'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { Sparkles, Upload, Wand2, Loader2, ThumbsUp, ThumbsDown, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { suggestBestPhotos, SuggestBestPhotosOutput } from '@/ai/flows/ai-photo-curation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function PhotoCurationPage() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<SuggestBestPhotosOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos: string[] = [];
      const promises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(new Error('Failed to read file.'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises)
        .then(results => {
          setPhotos(prev => [...prev, ...results].slice(0, 5)); // Limit to 5 photos
        })
        .catch(error => {
          console.error('Error reading files:', error);
          toast.error('Error', {
            description: 'Failed to upload photos.',
          });
        });
    }
  };

  const handleAnalyzeClick = async () => {
    if (photos.length === 0) {
      toast.error('No Photos', {
        description: 'Please upload at least one photo to analyze.',
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const result = await suggestBestPhotos({ photoDataUris: photos });
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing photos:', error);
      toast.error('AI Analysis Failed', {
        description: 'The AI King could not process your request. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <header className="flex items-center gap-2 mb-6">
        <Wand2 className="text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Photo Curation Oracle</h1>
      </header>

      <div className="grid md:grid-cols-2 gap-8 flex-1">
        {/* Left Side: Uploader */}
        <div className="flex flex-col gap-6">
          <Card
            className="flex-1 border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
              <Upload className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Upload Your Photos</h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to select up to 5 images.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                <Image src={photo} alt={`Uploaded photo ${index + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>

          <Button onClick={handleAnalyzeClick} disabled={isLoading || photos.length === 0} size="lg">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Consult the Oracle
          </Button>
        </div>

        {/* Right Side: Results */}
        <div className="flex flex-col">
          <Card className="flex-1 bg-card/50 overflow-hidden">
            <CardContent className="p-6 h-full overflow-y-auto">
              {!analysisResult && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Wand2 className="size-16 text-muted-foreground" />
                  <h2 className="mt-6 text-xl font-semibold">Awaiting Your Offering</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload your photos and consult the AI King for divine guidance on your profile picture.
                  </p>
                </div>
              )}
              {isLoading && (
                 <div className="flex flex-col items-center justify-center h-full text-center">
                  <Loader2 className="size-16 text-primary animate-spin" />
                  <h2 className="mt-6 text-xl font-semibold">The Oracle is Scrying...</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Analyzing every pixel to forge your new first impression.
                  </p>
                </div>
              )}
              {analysisResult && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2"><Award /> The Oracle's #1 Pick</h2>
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-primary shadow-lg">
                      <Image src={analysisResult.bestPhotoDataUri} alt="Best Photo" fill className="object-cover" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-4">Overall Summary</h2>
                    <p className="text-muted-foreground bg-muted p-4 rounded-lg">{analysisResult.overallSummary}</p>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-4">Detailed Analysis</h2>
                    <div className="space-y-6">
                      {analysisResult.analysis.map((item, index) => (
                        <div key={index} className="grid md:grid-cols-[100px_1fr] gap-4 items-start">
                          <Image src={item.photoDataUri} alt={`Analyzed photo ${index + 1}`} width={100} height={133} className="rounded-md object-cover aspect-[3/4]" />
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                               <p className="font-bold">Attraction Score: {item.score}/10</p>
                               <Progress value={item.score * 10} className="w-24 h-2" indicatorClassName={getScoreColor(item.score)} />
                             </div>
                            <p className="text-sm text-muted-foreground">{item.feedback}</p>
                             <Badge variant={item.isRecommended ? "default" : "destructive"}>
                              {item.isRecommended ? <ThumbsUp className="size-3 mr-1.5" /> : <ThumbsDown className="size-3 mr-1.5" />}
                              {item.isRecommended ? 'Recommended' : 'Not Recommended'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
