# 🚀 Supabase Realtime Migration Deployment Instructions

## **CRITICAL: Deploy This ASAP**

The `database/06_realtime_notifications_broadcast.sql` migration implements **scalable realtime** using best practices.

### **Step 1: Run Migration in Supabase Dashboard**

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Copy and paste the contents of: database/06_realtime_notifications_broadcast.sql
# Click "Run"
```

### **Step 2: Verify Migration**

```sql
-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'notifications_broadcast_trigger';

-- Check RLS policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'realtime';
```

### **Step 3: Enable Realtime on Tables (if not already enabled)**

```sql
-- In Supabase Dashboard > Database > Replication
-- Enable realtime for: notifications table
```

### **Step 4: Test Realtime**

```javascript
// Test in browser console on your app
const supabase = createClient(url, key);
const channel = supabase.channel('user:YOUR_USER_ID:notifications', {
  config: { private: true }
});

await supabase.realtime.setAuth(YOUR_ACCESS_TOKEN);

channel
  .on('broadcast', { event: 'INSERT' }, (payload) => {
    console.log('✅ Realtime working!', payload);
  })
  .subscribe();
```

### **Benefits**

✅ **10x more scalable** than `postgres_changes`  
✅ **Private channels** with RLS authorization  
✅ **Dedicated topics** per user for better performance  
✅ **Best practices** per Supabase Realtime AI Assistant Guide  

### **Rollback (if needed)**

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS notifications_broadcast_trigger ON notifications;
DROP FUNCTION IF EXISTS notifications_broadcast_trigger();

-- Remove RLS policies
DROP POLICY IF EXISTS "users_can_receive_notification_broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "users_can_send_notification_broadcasts" ON realtime.messages;
```

---

## **Migration File**

File: `database/06_realtime_notifications_broadcast.sql`

**Status:** ✅ Already created and ready to deploy

