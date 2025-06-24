# Lock Persistence Test

## Problem Description ✅ FIXED
When users lock questions in one tab (e.g., MCQ) and switch to another tab (e.g., True/False), then return to the original tab, the locked questions become unlocked.

## New Problem Description ✅ FIXED
When user locks 1 MCQ question, it unexpectedly locks 2 MCQ questions. The lock is affecting an extra question due to ID collisions.

## Root Cause Analysis

### Original Issue ✅ 
1. Using array index in the unique ID generation, which changes when questions are filtered by tab
2. Automatic cleanup effect that removed "stale" locks when the questions array changed
3. The cleanup treated filtered-out questions as permanently removed

### New Issue ✅
1. **ID Collisions**: Similar questions generate identical IDs, causing locks to affect multiple questions
2. **Insufficient Uniqueness**: The hash generation doesn't include enough distinguishing information
3. **Hash Truncation**: Truncating the hash too aggressively increases collision probability

## Solution Implemented

### 1. Improved Unique ID Generation ✅ + 🔧
- **V1**: Removed index from the unique ID to make it consistent across tab switches
- **V2**: Enhanced ID generation with comprehensive content inclusion
- **V3**: Added explicit field labeling and fallback values to prevent empty field collisions
- Used structured content parts with prefixes (e.g., `type:`, `q:`, `ans:`)
- Include content length as additional uniqueness factor

### 2. Collision Detection & Prevention ✅ NEW
- Added real-time collision detection to identify ID conflicts
- Comprehensive content inclusion (all MCQ options, question type, etc.)
- Fallback handling for special characters in content
- Base36 content length encoding for compactness
- Visual warning banner when collisions are detected

### 3. Removed Automatic Cleanup ✅
- Removed the useEffect that automatically cleaned up locks when questions changed
- This prevents locks from being removed just because questions are filtered by tab

### 4. Manual Lock Management ✅
- "Clear All Locks" button available for clearing all locks at once
- Individual lock/unlock functionality for each question

### 5. Visual Feedback ✅
- Added an info banner when there are locked questions in other tabs
- Shows the count of locked questions not visible in current tab
- Reassures users that their locks are preserved

## Test Scenarios

### Test 1: Basic Lock Persistence ✅
1. Go to MCQ tab
2. Lock 2 questions
3. Switch to True/False tab
4. Switch back to MCQ tab
5. ✅ Expected: The 2 MCQ questions should still be locked

### Test 2: Single Question Lock Precision ✅ NEW
1. Go to MCQ tab
2. Lock exactly 1 question
3. ✅ Expected: Only that 1 question should be locked, not any additional questions
4. ✅ Expected: Check browser console for any ID collision warnings

### Test 3: Cross-Tab Lock Management ✅
1. Lock questions in multiple tabs
2. Switch between tabs
3. ✅ Expected: Each tab should show its own locked questions
4. ✅ Expected: Info banner should appear in tabs with no locked questions

### Test 4: Individual Lock Control ✅
1. Lock individual questions in any tab
2. Unlock specific questions without affecting others
3. ✅ Expected: Each question's lock state is independent
4. ✅ Expected: "Clear All Locks" button clears all locks when clicked

### Test 5: ID Collision Detection ✅ NEW
1. Open browser developer console
2. Lock various questions
3. ✅ Expected: No "ID Collision detected!" warnings in console
4. ✅ Expected: No red warning banner appears in the UI
5. ✅ Expected: Each question should have a unique lock behavior

## Files Modified
- `frontend/src/components/QuestionEditor.tsx`
  - ✅ Updated unique ID generation (removed index dependency)
  - ✅ Removed automatic cleanup effect  
  - ✅ Added manual lock management (Clear All Locks button)
  - ✅ Added visual indicators for cross-tab locks
  - ✅ Enhanced ID generation to prevent collisions
  - ✅ Added collision detection and debugging
  - ✅ Improved content hashing with structured prefixes
  - ✅ Added visual collision warning banner

## Debugging Information
The system now includes:
- Real-time ID collision detection
- Visual warning banner when collisions are detected
- Console warnings with detailed collision information
- This helps ensure the "1 lock → 1 question locked" behavior works correctly
