# 🚨 QUICK FIX - Swipe Page Motion Values

**Issue:** `Cannot find name 'likeOpacity'` at line 271  
**File:** `app/discover/swipe/page.tsx`

## Problem

Motion values (`likeOpacity`, `likeScale`, `nopeOpacity`, `nopeScale`) are defined in the component root but used inside a `.map()` callback where they're out of scope.

## Solution Options

### Option 1: Move motion values inside map (RECOMMENDED)
```typescript
// Inside kings.map():
const cardX = useMotionValue(0);
const cardLikeOpacity = useTransform(cardX, [50, 100], [0, 1]);
```

### Option 2: Use inline transforms
```typescript
<motion.div
  style={{
    opacity: useTransform(x, [50, 100], [0, 1]),
  }}
>
```

### Option 3: Extract to separate component
```typescript
function SwipeCard({ king, isTop, x }: Props) {
  const likeOpacity = useTransform(x, [50, 100], [0, 1]);
  // ...render card
}
```

## Quick Apply

Replace the swipe indicators section with:

```typescript
{/* Swipe Indicators */}
{isTop && (
  <>
    <motion.div
      animate={{
        opacity: x.get() > 50 ? 1 : 0,
        scale: x.get() > 50 ? 1 : 0.8,
      }}
      className="absolute top-8 left-8 text-6xl font-black text-green-500 border-4 border-green-500 rounded-2xl px-6 py-2 rotate-[-20deg]"
      aria-hidden="true"
    >
      LIKE
    </motion.div>

    <motion.div
      animate={{
        opacity: x.get() < -50 ? 1 : 0,
        scale: x.get() < -50 ? 1 : 0.8,
      }}
      className="absolute top-8 right-8 text-6xl font-black text-red-500 border-4 border-red-500 rounded-2xl px-6 py-2 rotate-[20deg]"
      aria-hidden="true"
    >
      NOPE
    </motion.div>
  </>
)}
```

This removes dependency on the out-of-scope motion values.

