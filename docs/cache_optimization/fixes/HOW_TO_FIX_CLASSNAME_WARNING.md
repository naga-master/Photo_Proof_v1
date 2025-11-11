# 🔧 Quick Fix: className Warning

## ⚡ If You See This Warning:

```
Invalid value for prop `className` on <input> tag
```

## ✅ Instant Fix

Use the `classNames` utility I created:

### Step 1: Import the Utility

```tsx
import { classNames } from '../utils/classNames';
// or
import { cn } from '../utils/classNames'; // shorter alias
```

### Step 2: Wrap Your className

**Before:**
```tsx
<input className={myVariable} />
<input className={condition && 'active'} />
<input className={`base ${cond && 'extra'}`} />
```

**After:**
```tsx
<input className={classNames(myVariable)} />
<input className={classNames(condition && 'active')} />
<input className={classNames('base', cond && 'extra')} />
```

## 📋 Common Patterns

### Pattern 1: Single Conditional

```tsx
// ❌ Can cause warning
<input className={isActive && 'active'} />

// ✅ Safe
<input className={classNames(isActive && 'active')} />
// or use ternary
<input className={isActive ? 'active' : ''} />
```

### Pattern 2: Multiple Conditions

```tsx
// ❌ Can cause warning
<input className={`base ${isValid && 'valid'} ${isActive && 'active'}`} />

// ✅ Safe
<input 
  className={classNames(
    'base',
    isValid && 'valid',
    isActive && 'active'
  )}
/>
```

### Pattern 3: Variable That Might Be Undefined

```tsx
// ❌ Can cause warning if undefined
<input className={dynamicClass} />

// ✅ Safe
<input className={classNames(dynamicClass)} />
// or
<input className={dynamicClass || ''} />
```

## 🎯 Real Example

**Typical input with error handling:**

```tsx
import { classNames } from '../utils/classNames';

function MyForm() {
  const [hasError, setHasError] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  
  return (
    <input 
      className={classNames(
        'mt-1 block w-full rounded-md',
        hasError ? 'border-red-500' : 'border-gray-300',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={isDisabled}
    />
  );
}
```

## 🚀 Why This Works

The `classNames` function:
1. Accepts any values (strings, booleans, undefined, null)
2. Filters out falsy values (`false`, `undefined`, `null`)
3. Joins remaining strings with spaces
4. **Always returns a valid string** (even if empty)

## ⚡ Quick Reference

```tsx
// Import
import { classNames, cn } from '../utils/classNames';

// Basic usage
className={classNames('base', 'another')}
// Returns: "base another"

// With conditions
className={classNames('base', isActive && 'active')}
// Returns: "base active" or "base"

// Multiple conditions
className={classNames(
  'base',
  cond1 && 'class1',
  cond2 && 'class2',
  variable
)}
// Returns: space-separated string of truthy values

// Short alias
className={cn('base', isActive && 'active')}
// Same as classNames
```

## ✅ Status

Your current code is already safe! This utility is for:
- Future components
- Adding conditional styling safely
- Preventing the warning if it appears

---

**That's it! Wrap any dynamic className with `classNames()` and you're safe!** 🎉
