-- Add comments to existing tables as per .gemini/rules/postgres-sql-style-guide.mdc

COMMENT ON TABLE public.profiles IS 'User profiles for the application, linked to authentication.';
COMMENT ON TABLE public.kings IS 'Details for "King" users, including pricing and availability.';
COMMENT ON TABLE public.bookings IS 'Booking details between users and Kings.';
COMMENT ON TABLE public.messages IS 'Chat messages exchanged between users and Kings.';
COMMENT ON TABLE public.reviews IS 'Reviews and ratings given by users for Kings.';
COMMENT ON TABLE public.notifications IS 'User-specific notifications.';
