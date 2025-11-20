/**
 * API Endpoints Registry
 * Complete audit and registration of all endpoints
 */

import { apiRouter } from './router';
import { ApiValidator } from './validators';
import { ApiException } from './error-handler';
import {
  EndpointDefinition,
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  GetMatchesQuery,
  Match,
  LikeUserRequest,
  UpdateProfileRequest,
  UserProfile,
  SendMessageRequest,
  Message,
  GetMessagesQuery,
  BlockUserRequest,
  ReportUserRequest,
  GetStreamTokenRequest,
  GetStreamTokenResponse,
  ErrorCode,
  HttpStatusCode,
} from './types';

/**
 * ========================================
 * AUTHENTICATION ENDPOINTS
 * ========================================
 */

// POST /auth/signup
export const signUpEndpoint: EndpointDefinition<SignUpRequest, SignUpResponse> = {
  metadata: {
    name: 'Sign Up',
    description: 'Register a new user with email and password',
    method: 'POST',
    path: '/auth/signup',
    authLevel: 'public',
    tags: ['auth', 'user-management'],
    version: '1.0',
    rateLimit: {
      requests: 5,
      windowMs: 3600000, // 1 hour
    },
  },
  validator: (input) => {
    const req = input as SignUpRequest;

    // Validate email
    const emailResult = ApiValidator.validateEmail(req.email);
    if (!emailResult.valid) {
      return { valid: false, error: emailResult.error! };
    }

    // Validate password
    const passwordResult = ApiValidator.validatePassword(req.password);
    if (!passwordResult.valid) {
      return { valid: false, error: passwordResult.error!, details: passwordResult.details };
    }

    // Validate role (only seeker or provider allowed for sign-up)
    const roleResult = ApiValidator.validateEnum(req.role, ['seeker', 'provider'] as const, 'Role');
    if (!roleResult.valid) {
      return { valid: false, error: roleResult.error! };
    }

    return {
      valid: true,
      data: {
        email: emailResult.data!,
        password: passwordResult.data!,
        role: roleResult.data!,
      },
    };
  },
  handler: async () => {
    // Implementation would call signUpWithPassword from auth.ts
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Auth service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

// POST /auth/signin
export const signInEndpoint: EndpointDefinition<SignInRequest, SignInResponse> = {
  metadata: {
    name: 'Sign In',
    description: 'Sign in with email and password',
    method: 'POST',
    path: '/auth/signin',
    authLevel: 'public',
    tags: ['auth'],
    version: '1.0',
    rateLimit: {
      requests: 10,
      windowMs: 3600000,
    },
  },
  validator: (input) => {
    const req = input as SignInRequest;

    const emailResult = ApiValidator.validateEmail(req.email);
    if (!emailResult.valid) {
      return { valid: false, error: emailResult.error! };
    }

    if (!req.password) {
      return { valid: false, error: 'Password is required' };
    }

    return {
      valid: true,
      data: {
        email: emailResult.data!,
        password: req.password,
      },
    };
  },
  handler: async () => {
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Auth service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

/**
 * ========================================
 * PROFILE ENDPOINTS
 * ========================================
 */

// GET /profile/:userId
export const getProfileEndpoint: EndpointDefinition<{ userId: string }, UserProfile> = {
  metadata: {
    name: 'Get Profile',
    description: 'Retrieve user profile information',
    method: 'GET',
    path: '/profile/:userId',
    authLevel: 'authenticated',
    tags: ['profile'],
    version: '1.0',
  },
  handler: async () => {
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Profile service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

// PATCH /profile/:userId
export const updateProfileEndpoint: EndpointDefinition<
  UpdateProfileRequest & { userId: string },
  UserProfile
> = {
  metadata: {
    name: 'Update Profile',
    description: 'Update user profile information',
    method: 'PATCH',
    path: '/profile/:userId',
    authLevel: 'authenticated',
    tags: ['profile'],
    version: '1.0',
  },
  validator: (input) => {
    const req = input as UpdateProfileRequest & { userId: string };

    const userIdResult = ApiValidator.validateUserId(req.userId);
    if (!userIdResult.valid) {
      return { valid: false, error: userIdResult.error! };
    }

    if (req.bio) {
      const bioResult = ApiValidator.validateStringLength(req.bio, 'Bio', 0, 500);
      if (!bioResult.valid) {
        return { valid: false, error: bioResult.error! };
      }
    }

    return { valid: true, data: req };
  },
  handler: async () => {
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Profile service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

/**
 * ========================================
 * MATCHES ENDPOINTS
 * ========================================
 */

// GET /matches
export const getMatchesEndpoint: EndpointDefinition<GetMatchesQuery, Match[]> = {
  metadata: {
    name: 'Get Matches',
    description: 'Retrieve all matches for the current user',
    method: 'GET',
    path: '/matches',
    authLevel: 'authenticated',
    tags: ['matches'],
    version: '1.0',
  },
  validator: (input) => {
    const query = input as GetMatchesQuery;

    if (query.limit !== undefined) {
      const paginationResult = ApiValidator.validatePagination(query.limit, query.offset);
      if (!paginationResult.valid) {
        return { valid: false, error: paginationResult.error! };
      }
    }

    if (query.status) {
      const statusResult = ApiValidator.validateEnum(query.status, ['active', 'rejected', 'all'], 'Status');
      if (!statusResult.valid) {
        return { valid: false, error: statusResult.error! };
      }
    }

    return { valid: true, data: query };
  },
  handler: async () => {
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Matches service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

// POST /matches/like
export const likeUserEndpoint: EndpointDefinition<LikeUserRequest, { success: boolean }> = {
  metadata: {
    name: 'Like User',
    description: 'Like another user (create potential match)',
    method: 'POST',
    path: '/matches/like',
    authLevel: 'authenticated',
    tags: ['matches'],
    version: '1.0',
    rateLimit: {
      requests: 50,
      windowMs: 3600000,
    },
  },
  validator: (input) => {
    const req = input as LikeUserRequest;
    const result = ApiValidator.validateUserId(req.toUserId);
    return result.valid
      ? { valid: true, data: req }
      : { valid: false, error: result.error! };
  },
  handler: async () => {
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Matches service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

/**
 * ========================================
 * CHAT ENDPOINTS
 * ========================================
 */

// GET /chat/:matchId/messages
export const getMessagesEndpoint: EndpointDefinition<GetMessagesQuery, Message[]> = {
  metadata: {
    name: 'Get Messages',
    description: 'Retrieve messages for a specific match',
    method: 'GET',
    path: '/chat/:matchId/messages',
    authLevel: 'authenticated',
    tags: ['chat'],
    version: '1.0',
  },
  validator: (input) => {
    const query = input as GetMessagesQuery;

    if (!query.matchId) {
      return { valid: false, error: 'Match ID is required' };
    }

    if (query.limit !== undefined) {
      const paginationResult = ApiValidator.validatePagination(query.limit, query.offset);
      if (!paginationResult.valid) {
        return { valid: false, error: paginationResult.error! };
      }
    }

    return { valid: true, data: query };
  },
  handler: async () => {
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Chat service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

// POST /chat/send
export const sendMessageEndpoint: EndpointDefinition<SendMessageRequest, Message> = {
  metadata: {
    name: 'Send Message',
    description: 'Send a message to a matched user',
    method: 'POST',
    path: '/chat/send',
    authLevel: 'authenticated',
    tags: ['chat'],
    version: '1.0',
    rateLimit: {
      requests: 100,
      windowMs: 60000, // 1 minute
    },
  },
  validator: (input) => {
    const req = input as SendMessageRequest;

    if (!req.matchId) {
      return { valid: false, error: 'Match ID is required' };
    }

    const contentResult = ApiValidator.validateStringLength(req.content, 'Message content', 1, 2000);
    if (!contentResult.valid) {
      return { valid: false, error: contentResult.error! };
    }

    if (req.type) {
      const typeResult = ApiValidator.validateEnum(req.type, ['text', 'image', 'video'], 'Message type');
      if (!typeResult.valid) {
        return { valid: false, error: typeResult.error! };
      }
    }

    return { valid: true, data: req };
  },
  handler: async () => {
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Chat service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

/**
 * ========================================
 * SAFETY ENDPOINTS
 * ========================================
 */

// POST /safety/block
export const blockUserEndpoint: EndpointDefinition<BlockUserRequest, { success: boolean }> = {
  metadata: {
    name: 'Block User',
    description: 'Block another user from contacting you',
    method: 'POST',
    path: '/safety/block',
    authLevel: 'authenticated',
    tags: ['safety', 'privacy'],
    version: '1.0',
  },
  validator: (input) => {
    const req = input as BlockUserRequest;
    const result = ApiValidator.validateUserId(req.blockedUserId);
    return result.valid
      ? { valid: true, data: req }
      : { valid: false, error: result.error! };
  },
  handler: async () => {
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Safety service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

// POST /safety/report
export const reportUserEndpoint: EndpointDefinition<ReportUserRequest, { success: boolean }> = {
  metadata: {
    name: 'Report User',
    description: 'Report inappropriate user behavior',
    method: 'POST',
    path: '/safety/report',
    authLevel: 'authenticated',
    tags: ['safety', 'moderation'],
    version: '1.0',
    rateLimit: {
      requests: 10,
      windowMs: 3600000,
    },
  },
  validator: (input) => {
    const req = input as ReportUserRequest;

    const userIdResult = ApiValidator.validateUserId(req.reportedUserId);
    if (!userIdResult.valid) {
      return { valid: false, error: userIdResult.error! };
    }

    const reasonResult = ApiValidator.validateStringLength(req.reason, 'Report reason', 10, 500);
    if (!reasonResult.valid) {
      return { valid: false, error: reasonResult.error! };
    }

    return { valid: true, data: req };
  },
  handler: async () => {
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Safety service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

/**
 * ========================================
 * STREAM ENDPOINTS
 * ========================================
 */

// POST /stream/token
export const getStreamTokenEndpoint: EndpointDefinition<
  GetStreamTokenRequest,
  GetStreamTokenResponse
> = {
  metadata: {
    name: 'Get Stream Token',
    description: 'Get authentication token for Stream Chat',
    method: 'POST',
    path: '/stream/token',
    authLevel: 'authenticated',
    tags: ['stream', 'chat'],
    version: '1.0',
  },
  validator: (input) => {
    const req = input as GetStreamTokenRequest;
    const result = ApiValidator.validateUserId(req.userId);
    return result.valid
      ? { valid: true, data: req }
      : { valid: false, error: result.error! };
  },
  handler: async () => {
    throw new ApiException(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Stream service not configured',
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  },
};

/**
 * ========================================
 * Register All Endpoints
 * ========================================
 */
export function registerAllEndpoints(): void {
  console.log('\n📋 Registering API Endpoints...\n');

  // Auth endpoints
  apiRouter.register('/auth/signup', 'POST', signUpEndpoint);
  apiRouter.register('/auth/signin', 'POST', signInEndpoint);

  // Profile endpoints
  apiRouter.register('/profile/:userId', 'GET', getProfileEndpoint);
  apiRouter.register('/profile/:userId', 'PATCH', updateProfileEndpoint);

  // Matches endpoints
  apiRouter.register('/matches', 'GET', getMatchesEndpoint);
  apiRouter.register('/matches/like', 'POST', likeUserEndpoint);

  // Chat endpoints
  apiRouter.register('/chat/:matchId/messages', 'GET', getMessagesEndpoint);
  apiRouter.register('/chat/send', 'POST', sendMessageEndpoint);

  // Safety endpoints
  apiRouter.register('/safety/block', 'POST', blockUserEndpoint);
  apiRouter.register('/safety/report', 'POST', reportUserEndpoint);

  // Stream endpoints
  apiRouter.register('/stream/token', 'POST', getStreamTokenEndpoint);

  console.log('✅ All endpoints registered successfully!\n');
}
