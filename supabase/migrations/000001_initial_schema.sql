-- Horus Level Enterprise Schema: Consolidated & Fortified
-- Version 1.0
-- Description: This single, unified schema contains the complete database structure,
-- including tables for profiles, conversations, messages, and bookings.
-- It has been fortified with high-performance indexes, robust security policies,
-- and vector embeddings for advanced AI-powered features.

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- Profiles Table: The central hub for user data.
-- Includes vector embedding for semantic matching.
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  bio text,
  avatar_url text,
  display_name text,
  birth_date date,
  gender text check (gender in ('man', 'woman', 'non-binary', 'other')),
  seeking_gender text check (seeking_gender in ('man', 'woman', 'non-binary', 'other', 'all')),
  location jsonb, -- {lat: number, lng: number, city: string}
  interests text[],
  height_cm integer,
  verified boolean default false,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'premium', 'vip')),
  embedding vector(1536) -- For AI-powered semantic search on profiles
);
alter table profiles enable row level security;
-- Add indexes for performance
create index idx_profiles_gender_seeking on profiles (gender, seeking_gender);
create index idx_profiles_location on profiles using gist (location);


-- Conversations Table: Establishes messaging channels between users.
create table conversations (
    id uuid primary key default gen_random_uuid(),
    "createdAt" timestamp with time zone default now() not null,
    "participant1Id" uuid references auth.users(id) on delete cascade,
    "participant2Id" uuid references auth.users(id) on delete cascade
);
alter table conversations enable row level security;
-- Add indexes for performance
create index idx_conversations_participants on conversations ("participant1Id", "participant2Id");


-- Messages Table: Stores all messages within conversations.
create table messages (
    id uuid primary key default gen_random_uuid(),
    "createdAt" timestamp with time zone default now() not null,
    "conversationId" uuid references conversations(id) on delete cascade,
    "senderId" uuid references auth.users(id) on delete cascade,
    content text not null
);
alter table messages enable row level security;
-- Add indexes for performance
create index idx_messages_conversation_id on messages ("conversationId");
create index idx_messages_sender_id on messages ("senderId");


-- Bookings Table: Manages user appointments or "meets".
create table bookings (
    id uuid primary key default gen_random_uuid(),
    "createdAt" timestamp with time zone default now() not null,
    "userId" uuid references auth.users(id) on delete cascade,
    "kingId" uuid references auth.users(id) on delete cascade,
    "bookingTime" timestamp with time zone not null,
    status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled'))
);
alter table bookings enable row level security;
-- Add indexes for performance
create index idx_bookings_user_id on bookings ("userId");
create index idx_bookings_king_id on bookings ("kingId");


-- POLICIES: Enforcing security and access control across all tables.

-- Profile Policies
create policy "Users can view all profiles." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- Conversation Policies
create policy "Users can view their own conversations." on conversations for select using (auth.uid() in ("participant1Id", "participant2Id"));
create policy "Users can create conversations." on conversations for insert with check (auth.uid() in ("participant1Id", "participant2Id"));

-- Message Policies
create policy "Users can view messages in their conversations." on messages for select using (auth.uid() in (select "participant1Id" from conversations where id = "conversationId") or auth.uid() in (select "participant2Id" from conversations where id = "conversationId"));
create policy "Users can send messages in their conversations." on messages for insert with check (auth.uid() = "senderId" and (auth.uid() in (select "participant1Id" from conversations where id = "conversationId") or auth.uid() in (select "participant2Id" from conversations where id = "conversationId")));

-- Booking Policies
create policy "Users can view their own bookings." on bookings for select using (auth.uid() = "userId" or auth.uid() = "kingId");
create policy "Users can create bookings." on bookings for insert with check (auth.uid() = "userId");
create policy "Users can update their own bookings." on bookings for update using (auth.uid() = "userId" or auth.uid() = "kingId");

-- FUNCTIONS: Reusable business logic for common database operations.

-- Function to get or create a conversation between two users.
create or replace function get_or_create_conversation(p_participant_id uuid)
returns uuid as $$
declare
    v_conversation_id uuid;
begin
    select id into v_conversation_id
    from conversations
    where (("participant1Id" = auth.uid() and "participant2Id" = p_participant_id)
        or ("participant1Id" = p_participant_id and "participant2Id" = auth.uid()))
    limit 1;

    if v_conversation_id is null then
        insert into conversations ("participant1Id", "participant2Id")
        values (auth.uid(), p_participant_id)
        returning id into v_conversation_id;
    end if;

    return v_conversation_id;
end;
$$ language plpgsql;

-- Function to get all conversations for the currently authenticated user.
create or replace function get_user_conversations()
returns table (
    "conversationId" uuid,
    "otherParticipantId" uuid,
    "otherParticipantUsername" text,
    "otherParticipantAvatar" text,
    "lastMessage" text,
    "lastMessageTimestamp" timestamptz
) as $$
begin
    return query
    select
        c.id as "conversationId",
        case
            when c."participant1Id" = auth.uid() then c."participant2Id"
            else c."participant1Id"
        end as "otherParticipantId",
        p.display_name as "otherParticipantUsername",
        p.avatar_url as "otherParticipantAvatar",
        (select content from messages where "conversationId" = c.id order by "createdAt" desc limit 1) as "lastMessage",
        (select "createdAt" from messages where "conversationId" = c.id order by "createdAt" desc limit 1) as "lastMessageTimestamp"
    from
        conversations c
    join
        profiles p on p.id = (
            case
                when c."participant1Id" = auth.uid() then c."participant2Id"
                else c."participant1Id"
            end
        )
    where
        c."participant1Id" = auth.uid() or c."participant2Id" = auth.uid();
end;
$$ language plpgsql;
