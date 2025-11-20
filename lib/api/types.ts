/**
 * API Type Definitions
 * Senior-level type system for all endpoints with strict typing
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type AuthLevel = 'public' | 'authenticated' | 'admin';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp?: string;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  statusCode: HttpStatusCode;
  details?: Record<string, unknown>;
}

export interface EndpointMetadata {
  name: string;
  description: string;
  method: HttpMethod;
  path: string;
  authLevel: AuthLevel;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  tags: string[];
  deprecated?: boolean;
  version: string;
}

export interface ValidatorFunction<T> {
  (input: unknown): { valid: true; data: T } | { valid: false; error: string; details?: Record<string, string> };
}

export interface EndpointHandler<TRequest = unknown, TResponse = unknown> {
  (
    request: TRequest,
    context: EndpointContext
  ): Promise<TResponse>;
}

export interface EndpointContext {
  userId?: string;
  userRole?: 'seeker' | 'provider' | 'admin';
  timestamp: Date;
  requestId: string;
  metadata?: Record<string, unknown>;
}

export interface EndpointDefinition<TRequest = unknown, TResponse = unknown> {
  metadata: EndpointMetadata;
  validator?: ValidatorFunction<TRequest>;
  handler: EndpointHandler<TRequest, TResponse>;
  errorHandler?: (error: unknown) => ApiError;
}

// Auth Endpoints
export interface SignUpRequest {
  email: string;
  password: string;
  role: 'seeker' | 'provider';
}

export interface SignUpResponse {
  userId: string;
  email: string;
  role: string;
  sessionToken: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  userId: string;
  email: string;
  sessionToken: string;
  role: string;
}

// Matches Endpoints
export interface GetMatchesQuery {
  limit?: number;
  offset?: number;
  status?: 'active' | 'rejected' | 'all';
}

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  status: 'active' | 'rejected' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface LikeUserRequest {
  toUserId: string;
}

// Profile Endpoints
export interface UpdateProfileRequest {
  fullName?: string;
  username?: string;
  bio?: string;
  gender?: string;
  birthdate?: string;
  preferences?: Record<string, unknown>;
  photos?: ProfilePhoto[];
  height?: number;
  bodyType?: string;
  ethnicity?: string;
  relationshipStatus?: string;
  relationshipGoals?: string[];
  smokingHabit?: string;
  drinkingHabit?: string;
  drugs?: string[];
  sexualOrientation?: string;
  sexualInterests?: string[];
  interests?: string[];
  occupation?: string;
  education?: string;
  religion?: string;
  politicalViews?: string;
  languages?: string[];
  instagramUsername?: string;
  tiktokUsername?: string;
  snapchatUsername?: string;
  website?: string;
  lookingFor?: string[];
  hivStatus?: string;
  lastTested?: string;
  vaccinationStatus?: string;
  pronouns?: string;
  displayAge?: boolean;
  displayDistance?: boolean;
}

export interface ProfilePhoto {
  id: string;
  url: string;
  isMain: boolean;
  order: number;
  uploadedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  bio?: string;
  gender?: string;
  birthdate?: string;
  avatarUrl?: string;
  preferences?: Record<string, unknown>;
  role: 'seeker' | 'provider' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  // Enhanced fields
  photos?: ProfilePhoto[];
  height?: number;
  bodyType?: string;
  ethnicity?: string;
  relationshipStatus?: string;
  relationshipGoals?: string[];
  smokingHabit?: string;
  drinkingHabit?: string;
  drugs?: string[];
  sexualOrientation?: string;
  sexualInterests?: string[];
  interests?: string[];
  occupation?: string;
  education?: string;
  religion?: string;
  politicalViews?: string;
  languages?: string[];
  instagramUsername?: string;
  tiktokUsername?: string;
  snapchatUsername?: string;
  website?: string;
  lookingFor?: string[];
  hivStatus?: string;
  lastTested?: string;
  vaccinationStatus?: string;
  pronouns?: string;
  displayAge?: boolean;
  displayDistance?: boolean;
  profileCompletionScore?: number;
}

// Chat Endpoints
export interface SendMessageRequest {
  matchId: string;
  content: string;
  type?: 'text' | 'image' | 'video';
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video';
  createdAt: string;
  updatedAt: string;
}

export interface GetMessagesQuery {
  matchId: string;
  limit?: number;
  offset?: number;
}

// Safety Endpoints
export interface BlockUserRequest {
  blockedUserId: string;
  reason?: string;
}

export interface ReportUserRequest {
  reportedUserId: string;
  reason: string;
  details?: string;
}

// Storage Endpoints
export interface UploadFileRequest {
  file: File;
  bucket: 'profile-pictures' | 'chat-media' | 'private-albums';
  fileName?: string;
}

export interface UploadFileResponse {
  url: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

// Stream Endpoints
export interface GetStreamTokenRequest {
  userId: string;
}

export interface GetStreamTokenResponse {
  token: string;
  userId: string;
  userName: string;
  userImage?: string;
}

export interface CreateStreamChannelRequest {
  otherUserId: string;
}

// Common Status Codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  RATE_LIMIT = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// Error Codes
export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
}
