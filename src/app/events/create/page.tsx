"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/components/providers/auth-provider";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ArrowLeft, Calendar, ImagePlus, Loader2, MapPin, Users} from "lucide-react";
import {motion} from "framer-motion";
import {useMutation} from '@tanstack/react-query';

const categories = [
    {value: "social" as const, label: "Social"},
    {value: "party" as const, label: "Party"},
    {value: "meetup" as const, label: "Meetup"},
    {value: "festival" as const, label: "Festival"},
    {value: "online" as const, label: "Online"},
];

export default function CreateEventPage() {
    const {user} = useAuth();
    const router = useRouter();

    const createEventMutation = useMutation({
        mutationFn: async (eventData: any) => {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user?.id || ''
                },
                body: JSON.stringify(eventData)
            });
            if (!response.ok) throw new Error('Failed to create event');
            return response.json();
        }
    });

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "" as typeof categories[number]['value'],
        location: "",
        date: "",
        time: "",
        maxAttendees: 10,
        imageUrl: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field: string, value: string | number) => {
        setFormData((prev) => ({...prev, [field]: value}));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = {...prev};
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (formData.title.length < 3) newErrors.title = "Title must be at least 3 characters";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (formData.description.length < 10) newErrors.description = "Description must be at least 10 characters";
        if (!formData.category) newErrors.category = "Category is required";
        if (!formData.location.trim()) newErrors.location = "Location is required";
        if (!formData.date) newErrors.date = "Date is required";
        if (!formData.time) newErrors.time = "Time is required";
        if (formData.maxAttendees < 2) newErrors.maxAttendees = "Minimum 2 attendees required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const dateTime = new Date(`${formData.date}T${formData.time}`);
            await createEventMutation.mutateAsync({
                title: formData.title,
                description: formData.description,
                category: formData.category,
                location: JSON.stringify({name: formData.location}),
                startDate: dateTime.toISOString(),
                capacity: formData.maxAttendees,
                imageUrl: formData.imageUrl || undefined,
            });
            router.push("/events");
        } catch (error) {
            console.error("Failed to create event:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        router.push("/auth/login");
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <header
                className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="mr-4"
                    >
                        <ArrowLeft className="h-5 w-5"/>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-primary"/>
                        <span className="text-xl font-bold">Create Event</span>
                    </div>
                </div>
            </header>

            <main className="container py-8">
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    className="max-w-2xl mx-auto"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Create a New Event</CardTitle>
                            <CardDescription>
                                Fill in the details below to create your event and invite others to join.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Event Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Give your event a catchy name"
                                        value={formData.title}
                                        onChange={(e) => handleChange("title", e.target.value)}
                                        className={errors.title ? "border-red-500" : ""}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-500">{errors.title}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe what your event is about..."
                                        value={formData.description}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        className={errors.description ? "border-red-500" : ""}
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-500">{errors.description}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => handleChange("category", value)}
                                    >
                                        <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select a category"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && (
                                        <p className="text-sm text-red-500">{errors.category}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location *</Label>
                                    <div className="relative">
                                        <MapPin
                                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                        <Input
                                            id="location"
                                            placeholder="Where will this event take place?"
                                            value={formData.location}
                                            onChange={(e) => handleChange("location", e.target.value)}
                                            className={`pl-9 ${errors.location ? "border-red-500" : ""}`}
                                        />
                                    </div>
                                    {errors.location && (
                                        <p className="text-sm text-red-500">{errors.location}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => handleChange("date", e.target.value)}
                                            className={errors.date ? "border-red-500" : ""}
                                            min={new Date().toISOString().split("T")[0]}
                                        />
                                        {errors.date && (
                                            <p className="text-sm text-red-500">{errors.date}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="time">Time *</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            value={formData.time}
                                            onChange={(e) => handleChange("time", e.target.value)}
                                            className={errors.time ? "border-red-500" : ""}
                                        />
                                        {errors.time && (
                                            <p className="text-sm text-red-500">{errors.time}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxAttendees">Maximum Attendees *</Label>
                                    <div className="relative">
                                        <Users
                                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                        <Input
                                            id="maxAttendees"
                                            type="number"
                                            min={2}
                                            max={1000}
                                            value={formData.maxAttendees}
                                            onChange={(e) => handleChange("maxAttendees", parseInt(e.target.value) || 10)}
                                            className={`pl-9 ${errors.maxAttendees ? "border-red-500" : ""}`}
                                        />
                                    </div>
                                    {errors.maxAttendees && (
                                        <p className="text-sm text-red-500">{errors.maxAttendees}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">Cover Image URL (Optional)</Label>
                                    <div className="relative">
                                        <ImagePlus
                                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                        <Input
                                            id="imageUrl"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.imageUrl}
                                            onChange={(e) => handleChange("imageUrl", e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => router.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createEventMutation.isPending}>
                                        {createEventMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Event"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}
