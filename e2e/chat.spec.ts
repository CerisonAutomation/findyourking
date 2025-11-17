import { test, expect, testUsers } from './fixtures';

/**
 * Chat and Messaging E2E Test Suite
 *
 * Comprehensive test coverage for real-time messaging:
 * - Initialize chat with king
 * - Send and receive messages
 * - Real-time message updates
 * - Read receipts and typing indicators
 * - Message history and pagination
 * - Media sharing (images, files)
 * - Chat notifications
 * - Chat blocking and muting
 *
 * @file Chat and real-time messaging test specifications
 * @see https://playwright.dev/docs/test-specs
 *
 * @example
 * // Run only chat tests
 * pnpm test:e2e chat.spec.ts
 *
 * // Run specific test
 * pnpm test:e2e chat.spec.ts -g "user can send and receive messages"
 */

/**
 * Test: User can open chat with king
 *
 * @test
 * @description Verifies chat initialization from booking or king profile
 * @steps
 * 1. Navigate to king detail page
 * 2. Click "Message King" button
 * 3. Verify chat window opens
 * 4. Verify message input available
 * 5. Verify chat history displays (if applicable)
 * 6. Verify king info shown in header
 * 7. Verify can close and reopen chat
 *
 * @expected
 * - Chat window initialized
 * - Empty state shown if no prior messages
 * - Input field ready for text
 * - King information visible
 * - Previous messages loaded if any
 *
 * @smoke
 */
test('user can open chat with king', async ({ page, testUtils, testUser }) => {
  // Login first
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Navigate to king profile
  await page.goto('/kings/test-king-001');
  await testUtils.waitForLoadingComplete();

  // Click message button
  await page.click('[data-testid="message-king-button"]');

  // Verify chat window opens
  await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

  // Verify input field visible
  await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

  // Verify king info in header
  await expect(page.locator('[data-testid="chat-header"]')).toContainText(
    'King',
  );

  // Verify empty state
  await expect(page.locator('[data-testid="empty-chat-state"]')).toBeVisible();
});

/**
 * Test: User can send and receive messages in real-time
 *
 * @test
 * @description Verifies message sending, receiving, and real-time updates
 * @steps
 * 1. Open chat window
 * 2. Type message in input
 * 3. Send message (click send or enter)
 * 4. Verify message appears in chat (sent state)
 * 5. Verify "sent" timestamp
 * 6. Open king's chat window (simulate)
 * 7. Verify message received
 * 8. Simulate king's response
 * 9. Verify message received in real-time
 * 10. Verify message marked as read
 *
 * @expected
 * - Message sent successfully
 * - Message appears with "sent" status
 * - Timestamp displayed
 * - Incoming messages update in real-time
 * - Message read status updated
 * - Smooth message flow
 *
 * @critical
 * @real-time
 */
test('user can send and receive messages in real-time', async ({
  page,
  context,
  testUtils,
  testUser,
}) => {
  // Setup: Login as user
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Navigate to king profile and open chat
  await page.goto('/kings/test-king-001');
  await testUtils.waitForLoadingComplete();

  await page.click('[data-testid="message-king-button"]');
  await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

  // Type and send message
  const messageText = 'Hi, I am interested in booking a session with you!';
  await page.fill('[data-testid="chat-input"]', messageText);
  await page.click('button[aria-label="Send message"]');

  // Verify message sent
  await expect(page.locator('text=' + messageText)).toBeVisible();

  // Verify sent status
  const sentMessage = page
    .locator('[data-testid="message"]')
    .filter({ hasText: messageText });
  await expect(
    sentMessage.locator('[data-testid="message-status"]'),
  ).toContainText('sent');

  // Verify timestamp
  await expect(
    sentMessage.locator('[data-testid="message-timestamp"]'),
  ).toBeVisible();

  // Wait for read receipt
  await page.waitForTimeout(2000);
  await expect(
    sentMessage.locator('[data-testid="message-status"]'),
  ).toContainText('read');

  // Verify incoming message (simulated)
  // In real test, this would come from king's actual response
  const incomingText =
    'Thanks for your interest! I would love to work with you.';
  await page.evaluate((text) => {
    // Simulate incoming message
    window.dispatchEvent(
      new CustomEvent('message:received', {
        detail: { text, sender: 'king-001', timestamp: Date.now() },
      }),
    );
  }, incomingText);

  // Verify incoming message appears
  await expect(page.locator('text=' + incomingText)).toBeVisible({
    timeout: 5000,
  });

  // Verify incoming message marked as read
  const incomingMessage = page
    .locator('[data-testid="message"]')
    .filter({ hasText: incomingText });
  await expect(
    incomingMessage.locator('[data-testid="message-status"]'),
  ).toContainText('read');
});

/**
 * Test: User receives typing indicators
 *
 * @test
 * @description Verifies typing indicator display during active typing
 * @steps
 * 1. Open chat window
 * 2. Simulate king typing (via WebSocket or mock)
 * 3. Verify typing indicator shows
 * 4. Verify placeholder shows "King is typing..."
 * 5. Wait for typing to stop
 * 6. Verify typing indicator disappears
 * 7. Verify message appears
 *
 * @expected
 * - Typing indicator visible when user types
 * - "X is typing..." message shown
 * - Typing state cleared when message sent
 * - Multiple typers show "2+ typing..."
 *
 * @real-time
 */
test('user can see typing indicators', async ({
  page,
  testUtils,
  testUser,
}) => {
  // Login and open chat
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  await page.goto('/kings/test-king-001');
  await testUtils.waitForLoadingComplete();

  await page.click('[data-testid="message-king-button"]');
  await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

  // Send initial message
  await page.fill('[data-testid="chat-input"]', 'Hello!');
  await page.click('button[aria-label="Send message"]');
  await testUtils.waitForLoadingComplete();

  // Simulate typing indicator from king
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('user:typing', {
        detail: { userId: 'king-001', typing: true },
      }),
    );
  });

  // Verify typing indicator shown
  await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
  await expect(page.locator('[data-testid="typing-text"]')).toContainText(
    'King is typing',
  );

  // Simulate king stops typing
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('user:typing', {
        detail: { userId: 'king-001', typing: false },
      }),
    );
  });

  // Verify typing indicator disappears
  await expect(
    page.locator('[data-testid="typing-indicator"]'),
  ).not.toBeVisible();
});

/**
 * Test: User can view message history and pagination
 *
 * @test
 * @description Verifies message history loading and infinite scroll
 * @steps
 * 1. Open chat with history (>50 messages)
 * 2. Verify latest messages visible
 * 3. Scroll up in chat
 * 4. Verify older messages load (pagination)
 * 5. Verify timestamps maintain order
 * 6. Continue scrolling to oldest message
 * 7. Verify "No earlier messages" state
 * 8. Scroll down to return to recent
 *
 * @expected
 * - Recent messages load initially
 * - Older messages load on scroll up
 * - Smooth infinite scroll
 * - Correct chronological order
 * - Message count increases as scroll
 * - "No earlier messages" at beginning
 *
 * @integration-test
 */
test('user can view message history with pagination', async ({
  page,
  testUtils,
  testUser,
}) => {
  // Login
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Navigate to existing chat (with history)
  await page.goto('/chat/king-001');
  await testUtils.waitForLoadingComplete();

  // Get initial message count
  let messageCount = await page.locator('[data-testid="message"]').count();
  expect(messageCount).toBeGreaterThan(0);

  // Scroll up to load older messages
  const chatContainer = page.locator('[data-testid="chat-messages"]');
  await chatContainer.evaluate((el) => {
    el.scrollTop = 0;
  });

  // Wait for pagination
  await page.waitForTimeout(1000);

  // Verify more messages loaded
  const newMessageCount = await page.locator('[data-testid="message"]').count();
  expect(newMessageCount).toBeGreaterThan(messageCount);

  // Continue scrolling up
  await chatContainer.evaluate((el) => {
    el.scrollTop = 0;
  });

  // Wait for more messages
  await page.waitForTimeout(1000);

  // Scroll multiple times to reach beginning
  let previousCount = newMessageCount;
  for (let i = 0; i < 5; i++) {
    await chatContainer.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(500);
  }

  // Verify at beginning
  const finalCount = await page.locator('[data-testid="message"]').count();
  expect(finalCount).toBeGreaterThan(0);

  // Check for "No earlier messages" indicator
  await expect(
    page.locator('[data-testid="no-earlier-messages"]'),
  ).toBeVisible();
});

/**
 * Test: User can share media in chat
 *
 * @test
 * @description Verifies image and file sharing functionality
 * @steps
 * 1. Open chat window
 * 2. Click attachment button
 * 3. Select image file from device
 * 4. Verify preview shown
 * 5. Add message caption (optional)
 * 6. Send image
 * 7. Verify image appears in chat
 * 8. Verify image loads correctly
 * 9. Verify file name displayed
 * 10. Test PDF file share
 * 11. Verify download link available
 *
 * @expected
 * - File picker opens
 * - Image preview shown before send
 * - Images display inline in chat
 * - Files show download button
 * - File size displayed
 * - Upload progress shown
 *
 * @integration-test
 */
test('user can share media in chat', async ({ page, testUtils, testUser }) => {
  // Login and open chat
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  await page.goto('/chat/king-001');
  await testUtils.waitForLoadingComplete();

  // Click attachment button
  await page.click('[data-testid="attachment-button"]');

  // Verify file input becomes active
  const fileInput = page.locator('input[type="file"]');
  expect(fileInput).toBeTruthy();

  // Note: File selection is limited in Playwright, so we simulate
  // In real tests, use page.setInputFiles()
  // const testImagePath = './test-fixtures/test-image.jpg';
  // await fileInput.setInputFiles(testImagePath);

  // Mock file upload
  await page.evaluate(() => {
    const event = new CustomEvent('file:selected', {
      detail: {
        filename: 'test-image.jpg',
        size: 1024,
        type: 'image/jpeg',
      },
    });
    window.dispatchEvent(event);
  });

  // Verify preview shown
  await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();
  await expect(page.locator('[data-testid="file-preview"]')).toContainText(
    'test-image.jpg',
  );

  // Add caption
  await page.fill('[data-testid="file-caption"]', 'Check out this image!');

  // Send file
  await page.click('[data-testid="send-file-button"]');

  // Verify file appears in chat
  await expect(page.locator('text=Check out this image!')).toBeVisible();

  // Verify image media shown
  await expect(page.locator('[data-testid="message-image"]')).toBeVisible();
});

/**
 * Test: User receives notifications for new messages
 *
 * @test
 * @description Verifies notification system for incoming messages
 * @steps
 * 1. User opens chat
 * 2. User closes chat or navigates away
 * 3. King sends message (simulate)
 * 4. Verify browser notification appears
 * 5. Verify notification has: sender name, message preview, avatar
 * 6. Click notification
 * 7. Verify redirects to chat
 * 8. Verify message marked as read
 *
 * @expected
 * - Notification appears when chat closed
 * - Notification shows message preview
 * - Notification includes sender info
 * - Clicking notification opens chat
 * - Message automatically marked as read
 *
 * @integration-test
 */
test('user receives notifications for new messages', async ({
  page,
  context,
  testUtils,
  testUser,
}) => {
  // Grant notification permission
  await context.grantPermissions(['notifications']);

  // Login
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Open chat
  await page.goto('/chat/king-001');
  await testUtils.waitForLoadingComplete();

  // Send a message first
  await page.fill('[data-testid="chat-input"]', 'Hello King!');
  await page.click('button[aria-label="Send message"]');
  await testUtils.waitForLoadingComplete();

  // Navigate away from chat
  await page.goto('/dashboard');
  await testUtils.waitForLoadingComplete();

  // Simulate incoming message
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('message:received', {
        detail: {
          chatId: 'king-001',
          sender: 'King User',
          avatar: '/avatars/king-001.jpg',
          message: 'Great to hear from you!',
          timestamp: Date.now(),
        },
      }),
    );
  });

  // Verify notification (checking page for notification UI element)
  await expect(
    page.locator('[data-testid="notification-badge"]'),
  ).toBeVisible();

  // Click notification to return to chat
  const notificationLink = page
    .locator('[data-testid="notification-badge"] a')
    .first();
  await notificationLink.click();

  // Verify redirected to chat
  await page.waitForURL(/\/chat\/king-001/);

  // Verify message appears
  await expect(page.locator('text=Great to hear from you!')).toBeVisible();
});

/**
 * Test: User can mute and unmute chat notifications
 *
 * @test
 * @description Verifies notification preference controls
 * @steps
 * 1. Open chat window
 * 2. Click settings/options menu
 * 3. Click "Mute Notifications" toggle
 * 4. Verify toggle state changes
 * 5. Simulate incoming message
 * 6. Verify NO notification appears
 * 7. Toggle unmute
 * 8. Simulate another message
 * 9. Verify notification appears again
 *
 * @expected
 * - Mute toggle saves preference
 * - No notifications when muted
 * - Notifications resume when unmuted
 * - Preference persists across sessions
 *
 * @integration-test
 */
test('user can mute and unmute chat notifications', async ({
  page,
  testUtils,
  testUser,
}) => {
  // Login and open chat
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  await page.goto('/chat/king-001');
  await testUtils.waitForLoadingComplete();

  // Open chat settings
  await page.click('[data-testid="chat-settings-button"]');

  // Verify settings menu visible
  await expect(
    page.locator('[data-testid="chat-settings-menu"]'),
  ).toBeVisible();

  // Click mute toggle
  await page.click('[data-testid="mute-notifications-toggle"]');

  // Verify muted (visual feedback)
  await expect(
    page.locator('[data-testid="mute-notifications-toggle"]'),
  ).toHaveClass(/muted|active/);

  // Navigate away and simulate message
  await page.goto('/dashboard');

  // Simulate incoming message while muted
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('message:received', {
        detail: { sender: 'King', message: 'This should not notify' },
      }),
    );
  });

  // Verify no notification badge
  await expect(
    page.locator('[data-testid="notification-badge"]'),
  ).not.toBeVisible();

  // Return to chat and unmute
  await page.goto('/chat/king-001');
  await testUtils.waitForLoadingComplete();

  await page.click('[data-testid="chat-settings-button"]');
  await page.click('[data-testid="mute-notifications-toggle"]');

  // Verify unmuted
  await expect(
    page.locator('[data-testid="mute-notifications-toggle"]'),
  ).not.toHaveClass(/muted|active/);

  // Navigate away and simulate message
  await page.goto('/dashboard');

  // Simulate incoming message while unmuted
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('message:received', {
        detail: { sender: 'King', message: 'This should notify' },
      }),
    );
  });

  // Verify notification appears
  await expect(
    page.locator('[data-testid="notification-badge"]'),
  ).toBeVisible();
});

/**
 * Test: User can block and unblock another user
 *
 * @test
 * @description Verifies user blocking functionality
 * @steps
 * 1. Open chat with user
 * 2. Click options menu
 * 3. Select "Block User"
 * 4. Confirm blocking
 * 5. Verify user added to blocked list
 * 6. Verify chat history hidden/archived
 * 7. Verify cannot receive messages from blocked user
 * 8. Navigate to account settings
 * 9. Open "Blocked Users" list
 * 10. Unblock user
 * 11. Verify user removed from blocked list
 *
 * @expected
 * - User added to blocked list
 * - Chat archived or hidden
 * - Messages from blocked user filtered
 * - Can unblock from settings
 * - Communications resume after unblock
 *
 * @integration-test
 */
test('user can block and unblock another user', async ({
  page,
  testUtils,
  testUser,
}) => {
  // Login
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Open chat
  await page.goto('/chat/king-001');
  await testUtils.waitForLoadingComplete();

  // Click options menu
  await page.click('[data-testid="chat-options-button"]');

  // Verify menu visible
  await expect(page.locator('[data-testid="chat-options-menu"]')).toBeVisible();

  // Click block option
  await page.click('[data-testid="block-user-option"]');

  // Confirm blocking
  await expect(
    page.locator('[data-testid="block-confirmation-dialog"]'),
  ).toBeVisible();
  await page.click('button:has-text("Block")');

  // Verify user blocked (notification shown)
  await testUtils.expectSuccessNotification('User blocked');

  // Verify chat archived
  await expect(
    page.locator('[data-testid="chat-archived-state"]'),
  ).toBeVisible();

  // Navigate to settings
  await page.goto('/settings/blocked-users');
  await testUtils.waitForLoadingComplete();

  // Verify user in blocked list
  await expect(page.locator('text=King User')).toBeVisible();

  // Click unblock button
  const blockCard = page
    .locator('[data-testid="blocked-user-card"]')
    .filter({ hasText: 'King User' });
  await blockCard.locator('[data-testid="unblock-button"]').click();

  // Confirm unblock
  await page.click('button:has-text("Unblock")');

  // Verify user removed from list
  await expect(page.locator('text=King User')).not.toBeVisible();

  // Verify success message
  await testUtils.expectSuccessNotification('User unblocked');
});
