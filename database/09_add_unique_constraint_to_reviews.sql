-- Add a unique constraint to ensure only one review per user per booking
ALTER TABLE reviews
ADD CONSTRAINT unique_review_per_booking_user UNIQUE (booking_id, user_id);
