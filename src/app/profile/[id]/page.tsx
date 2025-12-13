'use client';
import { useUser } from '@/hooks/use-user';
import { UserProfile } from '@/lib/types';
import { Loader2, Eye, Heart, Users as UsersIcon, MessageCircle, MoreVertical, ShieldAlert, Octagon, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase-client';

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('userId', userId)
        .single();
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data as UserProfile;
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
    const { user: currentUser } = useUser();
    const router = useRouter();
    const supabase = createClient();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['userProfile', params.id],
        queryFn: () => fetchUserProfile(params.id),
        enabled: !!params.id,
    });

    const handleStartConversation = async () => {
        if (!currentUser || !profile || currentUser.id === profile.userId) return;

        const conversationId = [currentUser.id, profile.userId].sort().join('_');
        
        const { error } = await supabase.from('conversations').upsert({
            id: conversationId,
            participant1Id: currentUser.id,
            participant2Id: profile.userId,
            lastMessageAt: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: true });
        
        if (error) {
            toast.error("Could not start conversation.");
            console.error(error);
            return;
        }

        router.push(`/messages/${profile.userId}`);
    };
    
    const handleAddToFavorites = () => {
        if (!currentUser || !profile) return;
        // In a real app, you would have a 'favorites' collection or field.
        toast.success(`${profile.id} has been added to your favorites!`);
    }
    
    const handleBlockUser = () => {
        if (!currentUser || !profile) return;
        // In a real app, you'd update a blocklist.
        toast.error(`You have blocked ${profile.id}.`);
        router.push('/discover');
    }

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary size-12" /></div>
    }

    if (!profile) {
        return <div className="flex h-full items-center justify-center text-muted-foreground">This king does not exist in our realm.</div>
    }

    const isCurrentUserProfile = currentUser?.id === profile.userId;

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
             <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-primary">
                        <AvatarImage src={profile.avatarUrl ?? undefined} />
                        <AvatarFallback>{profile.id ? profile.id.charAt(0) : '?'}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="text-center md:text-left">
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-bold">{profile.id}, {profile.age}</h1>
                        {!isCurrentUserProfile && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Actions for {profile.id}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleStartConversation}>
                                        <MessageCircle className="mr-2" />
                                        <span>Message</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleAddToFavorites}>
                                        <Heart className="mr-2" />
                                        <span>Add to Favorites</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Send className="mr-2" />
                                        <span>Share Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleBlockUser}>
                                        <ShieldAlert className="mr-2" />
                                        <span>Block User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <Octagon className="mr-2" />
                                        <span>Report</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <p className="text-muted-foreground">{profile.location}</p>
                    <p className="text-muted-foreground">{profile.height}cm</p>
                </div>
            </div>

            <Card className="mb-8 bg-card/80">
                <CardHeader>
                    <CardTitle className="text-lg">Profile Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <Eye className="size-6 text-primary" />
                        <p className="text-2xl font-bold">1.2k</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Heart className="size-6 text-primary" />
                        <p className="text-2xl font-bold">150</p>
                        <p className="text-xs text-muted-foreground">Favorites</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <UsersIcon className="size-6 text-primary" />
                        <p className="text-2xl font-bold">25</p>
                        <p className="text-xs text-muted-foreground">Matches</p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-8">
                <Card className="bg-card/80">
                    <CardHeader>
                        <CardTitle>Bio</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-muted-foreground whitespace-pre-line">{profile.bio}</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/80">
                    <CardHeader>
                        <CardTitle>Tribes / Interests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {profile.interests?.map(interest => (
                                <Badge key={interest} variant='secondary' className="text-base py-1 px-3">{interest}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
