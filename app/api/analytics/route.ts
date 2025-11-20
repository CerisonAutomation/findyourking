import { NextRequest, NextResponse } from 'next/server';

// Vercel Analytics endpoint for tracking AI interactions and performance
export async function POST(request: NextRequest) {
  try {
    const {
      event,
      userId,
      boyfriendId,
      conversationId,
      metrics,
      timestamp = new Date().toISOString()
    } = await request.json();

    if (!event || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: event, userId' },
        { status: 400 }
      );
    }

    // In a real implementation, this would send data to Vercel Analytics
    // For now, we'll log and return success
    console.log('Analytics Event:', {
      event,
      userId,
      boyfriendId,
      conversationId,
      metrics,
      timestamp,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // Process different event types
    let processedMetrics = {};

    switch (event) {
      case 'ai_response_generated':
        processedMetrics = {
          response_time: metrics?.responseTime || 0,
          token_count: metrics?.tokenCount || 0,
          model_used: metrics?.model || 'unknown',
          sentiment_score: metrics?.sentiment || 0,
          engagement_level: metrics?.engagement || 'medium',
        };
        break;

      case 'conversation_started':
        processedMetrics = {
          boyfriend_type: metrics?.boyfriendType || 'unknown',
          user_mood: metrics?.userMood || 'neutral',
          conversation_goal: metrics?.goal || 'casual_chat',
        };
        break;

      case 'message_sent':
        processedMetrics = {
          message_length: metrics?.messageLength || 0,
          message_type: metrics?.messageType || 'text',
          has_attachments: metrics?.hasAttachments || false,
          typing_speed: metrics?.typingSpeed || 0,
        };
        break;

      case 'feature_used':
        processedMetrics = {
          feature_name: metrics?.featureName || 'unknown',
          usage_duration: metrics?.duration || 0,
          success: metrics?.success !== false,
          error_type: metrics?.errorType || null,
        };
        break;

      case 'user_engagement':
        processedMetrics = {
          session_duration: metrics?.sessionDuration || 0,
          pages_viewed: metrics?.pagesViewed || 1,
          interactions_count: metrics?.interactionsCount || 0,
          satisfaction_score: metrics?.satisfaction || 5,
        };
        break;

      default:
        processedMetrics = metrics || {};
    }

    return NextResponse.json({
      success: true,
      event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event,
      user_id: userId,
      timestamp,
      processed_metrics: processedMetrics,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get analytics data for dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const timeframe = searchParams.get('timeframe') || '7d';
    const eventType = searchParams.get('eventType');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Mock analytics data - in real implementation, this would query Vercel Analytics
    const mockAnalytics = {
      user_id: userId,
      timeframe,
      summary: {
        total_events: 245,
        total_conversations: 12,
        average_response_time: '1.2s',
        ai_interactions: 156,
        feature_usage: {
          chat: 89,
          profile_view: 34,
          matchmaking: 23,
          settings: 12,
        },
      },
      trends: {
        daily_active_users: [12, 15, 18, 22, 19, 25, 28],
        conversation_length: [5.2, 6.1, 4.8, 7.3, 5.9, 8.1, 6.7],
        satisfaction_score: [4.2, 4.5, 4.1, 4.7, 4.3, 4.8, 4.6],
      },
      performance: {
        api_response_times: {
          p50: '800ms',
          p95: '2.1s',
          p99: '4.5s',
        },
        error_rate: '0.12%',
        uptime: '99.98%',
      },
      ai_metrics: {
        total_responses: 156,
        average_tokens: 247,
        model_distribution: {
          'gpt-4': 45,
          'claude-3': 38,
          'gemini-pro': 17,
        },
        sentiment_distribution: {
          positive: 68,
          neutral: 25,
          negative: 7,
        },
      },
    };

    // Filter by event type if specified
    if (eventType) {
      // In real implementation, filter the data
      mockAnalytics.summary.total_events = Math.floor(mockAnalytics.summary.total_events * 0.3);
    }

    return NextResponse.json(mockAnalytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}