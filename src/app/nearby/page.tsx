"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/components/providers/auth-provider";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Heart, Loader2, MapPin, MessageCircle, Navigation, Radio, Zap} from "lucide-react";
import {formatDistance, getInitials} from "@/lib/utils";
import {AnimatePresence, motion} from "framer-motion";
import {Slider} from "@/components/ui/slider";
import {Switch} from "@/components/ui/switch";

interface NearbyProfile {
    id: string;
    name: string;
    age: number;
    distance: number;
    avatarUrl?: string;
    isOnline: boolean;
    lastSeen?: string;
    intent?: string;
}

const mockNearbyProfiles: NearbyProfile[] = [
    {id: "1", name: "Marcus", age: 29, distance: 0.3, isOnline: true, intent: "Looking for coffee"},
    {id: "2", name: "David", age: 34, distance: 0.8, isOnline: true, intent: "Up for a walk"},
    {id: "3", name: "Alex", age: 26, distance: 1.2, isOnline: false, lastSeen: "5m ago"},
    {id: "4", name: "Ryan", age: 31, distance: 2.5, isOnline: true, intent: "Free tonight"},
    {id: "5", name: "Jordan", age: 28, distance: 3.1, isOnline: false, lastSeen: "1h ago"},
];

export default function NearbyPage() {
    const {user, isLoading: authLoading} = useAuth();
    const router = useRouter();
    const [profiles] = useState<NearbyProfile[]>(mockNearbyProfiles);
    const [isMeetNowActive, setIsMeetNowActive] = useState(false);
    const [searchRadius, setSearchRadius] = useState([10]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth/login");
        }
    }, [user, authLoading, router]);

    const handleMeetNowToggle = async (enabled: boolean) => {
        setIsLoading(true);
        setIsMeetNowActive(enabled);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIsLoading(false);
    };

    const filteredProfiles = profiles.filter((p) => p.distance <= searchRadius[0]);

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen flex-col">
            <header
                className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Navigation className="h-6 w-6 text-primary"/>
                        <span className="text-xl font-bold">Nearby</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Zap
                                className={`h-4 w-4 ${isMeetNowActive ? "text-primary animate-pulse" : "text-muted-foreground"}`}/>
                            <span className="text-sm">Meet Now</span>
                            <Switch checked={isMeetNowActive} onCheckedChange={handleMeetNowToggle}
                                    disabled={isLoading}/>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container flex-1 py-6">
                <AnimatePresence>
                    {isMeetNowActive && (
                        <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: "auto"}}
                                    exit={{opacity: 0, height: 0}} className="mb-6">
                            <Card className="border-primary/50 bg-primary/5">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <Radio className="h-8 w-8 text-primary animate-pulse"/>
                                    <div>
                                        <h3 className="font-semibold">You are visible to nearby people</h3>
                                        <p className="text-sm text-muted-foreground">Others can see you are available to
                                            meet right now</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Discovery Radius</CardTitle>
                        <CardDescription>Show people within {searchRadius[0]}km of your location</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">1km</span>
                            <Slider value={searchRadius} onValueChange={setSearchRadius} min={1} max={50} step={1}
                                    className="flex-1"/>
                            <span className="text-sm text-muted-foreground">50km</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{filteredProfiles.length} people nearby</h2>
                    {filteredProfiles.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <MapPin className="mb-4 h-12 w-12 text-muted-foreground"/>
                                <h3 className="mb-2 text-lg font-semibold">No one nearby</h3>
                                <p className="text-center text-muted-foreground">Try increasing your discovery radius to
                                    find more people</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {filteredProfiles.map((profile, index) => (
                                <motion.div key={profile.id} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
                                            transition={{delay: index * 0.1}}>
                                    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className="relative">
                                                    <Avatar className="h-16 w-16">
                                                        <AvatarImage src={profile.avatarUrl}/>
                                                        <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                                                    </Avatar>
                                                    {profile.isOnline && <span
                                                        className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background bg-green-500"/>}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-semibold">{profile.name}, {profile.age}</h3>
                                                            <div
                                                                className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                <MapPin className="h-3 w-3"/>
                                                                {formatDistance(profile.distance * 1000)} away
                                                            </div>
                                                        </div>
                                                        {!profile.isOnline && profile.lastSeen && <span
                                                            className="text-xs text-muted-foreground">{profile.lastSeen}</span>}
                                                    </div>
                                                    {profile.intent &&
                                                        <p className="mt-2 text-sm text-primary">{profile.intent}</p>}
                                                </div>
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    <Heart className="mr-2 h-4 w-4"/>Like
                                                </Button>
                                                <Button size="sm" className="flex-1">
                                                    <MessageCircle className="mr-2 h-4 w-4"/>Message
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}