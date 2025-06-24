# Advanced Question Shuffling - Test Plan

## Overview
The shuffling feature now supports intelligent shuffle modes based on the current state of locked/unlocked questions and available pool size. The system automatically determines the best shuffle behavior and adapts the UI accordingly.

## Intelligent Shuffle Modes

### **Mode 1: Fresh Shuffle** 🎲
**When**: Multiple unlocked questions + unselected questions available
**Behavior**: Replaces unlocked questions with fresh selection from full pool
**Example**: 3 unlocked + 5 unselected → shuffle from 8 total questions

### **Mode 2: Replace Single** 🔄
**When**: Only 1 unlocked question + unselected questions available  
**Behavior**: Directly replaces the single unlocked question with a random fresh one
**Example**: 1 unlocked + 3 unselected → replace with 1 random from 3 available

### **Mode 3: Reorder Only** ↕️
**When**: Multiple unlocked questions but no unselected questions available
**Behavior**: Shuffles positions of current unlocked questions only
**Example**: 3 unlocked + 0 unselected → reorder the 3 questions

### **Mode 4: Disabled** ❌
**When**: Only 1 unlocked question + no unselected questions available
**Behavior**: Button is disabled (no point in shuffling)
**Example**: 1 unlocked + 0 unselected → button grayed out

## Smart UI Behavior

### **Dynamic Button State**:
- ✅ **Enabled**: When meaningful shuffle is possible
- ❌ **Disabled**: When only 1 unlocked question with no alternatives
- 🎨 **Visual feedback**: Different colors for enabled/disabled states

### **Context-Aware Tooltips**:
- **Fresh**: "Shuffle unlocked questions with fresh selection from the full question pool"
- **Replace**: "Replace the unlocked question with a fresh one from the question pool"  
- **Reorder**: "Reorder unlocked questions (no fresh questions available from pool)"
- **Disabled**: "Cannot shuffle: only 1 unlocked question with no alternatives available"

## Test Cases

### Test Case 0: Lock Clearing Before Generation
**Setup:**
- User has questions in edit mode
- Some questions are locked for editing protection
- User clicks "Continue to Preview" to generate exam documents

**Expected Result:**
- All locks are automatically cleared before generation
- **Immediate visual update**: Locked questions are immediately shown as unlocked (orange highlighting removed)
- User receives notification: "Cleared X locked question(s) before generating exam documents"
- All questions (previously locked and unlocked) are included in generated exam
- Success message confirms: "Exam generated successfully! All questions were included (locks cleared)"
- Visual warning near generate button explains this behavior

### Test Case 1: Fresh Shuffle Mode
**Setup:**
- 10 total MCQ questions in system
- User selects 5 questions (A, B, C, D, E)
- User locks questions A and B
- Questions C, D, E are unlocked (3 unlocked)
- 5 unselected questions available

**Expected Result:**
- Button enabled with "Fresh" tooltip
- Questions A, B remain locked in position
- Questions C, D, E replaced with 3 random from 8 available (5 unselected + 3 current unlocked)
- Result includes previously unselected questions

### Test Case 2: Replace Single Mode
**Setup:**
- 6 total MCQ questions in system
- User selects 3 questions (A, B, C)
- User locks questions A and B
- Question C is unlocked (1 unlocked)
- 3 unselected questions available

**Expected Result:**
- Button enabled with "Replace" tooltip
- Questions A, B remain locked
- Question C replaced with 1 random from 3 unselected questions
- Direct replacement, no shuffling needed

### Test Case 3: Reorder Only Mode
**Setup:**
- 5 total MCQ questions in system
- User selects all 5 questions (A, B, C, D, E)
- User locks questions A and B
- Questions C, D, E are unlocked (3 unlocked)
- 0 unselected questions available

**Expected Result:**
- Button enabled with "Reorder" tooltip
- Questions A, B remain locked in position
- Questions C, D, E shuffle positions among themselves
- No new questions introduced (none available)

### Test Case 4: Disabled Mode
**Setup:**
- 3 total MCQ questions in system
- User selects all 3 questions (A, B, C)
- User locks questions A and B
- Question C is unlocked (1 unlocked)
- 0 unselected questions available

**Expected Result:**
- Button disabled with grayed out appearance
- Tooltip explains why shuffle is disabled
- No action possible when clicked
- Clear visual indication that shuffle is not meaningful

### Test Case 5: Edge Case - All Unlocked, No Pool
**Setup:**
- 3 total MCQ questions in system
- User selects all 3 questions (A, B, C)
- No questions locked (3 unlocked)
- 0 unselected questions available

**Expected Result:**
- Button enabled with "Reorder" tooltip
- All questions shuffle positions among themselves
- Same questions, different order

### Test Case 6: Lock State Changes
**Setup:**
- Start with Fresh mode (multiple unlocked + pool available)
- Lock questions until only 1 unlocked remains
- Verify button state changes dynamically

**Expected Result:**
- Button changes from enabled to disabled
- Tooltip updates to reflect new state
- Visual styling updates accordingly

## Technical Implementation

### **Smart Detection Logic**:
```javascript
shuffleMode: 
  unlockedCount === 1 && availableFromPool === 0 ? 'disabled' :
  unlockedCount === 1 && availableFromPool > 0 ? 'replace' :
  availableFromPool === 0 ? 'reorder' : 'fresh'
```

### **UI State Management**:
- `getShuffleInfo()`: Analyzes current state and returns mode info
- `getShuffleTooltip()`: Returns appropriate tooltip for current mode
- Button `disabled` prop based on `canShuffle` flag
- Dynamic styling based on shuffle availability

### **Behavior Optimization**:
- **Replace mode**: Direct replacement without array shuffling (more efficient)
- **Reorder mode**: Position shuffling only (preserves question identity)
- **Fresh mode**: Full pool utilization with deduplication
- **Disabled mode**: Prevents meaningless operations

## Success Criteria

- ✅ **Smart mode detection**: Correct mode selected based on current state
- ✅ **Appropriate tooltips**: Clear explanation for each mode
- ✅ **Button state management**: Enabled/disabled based on meaningful action availability
- ✅ **Efficient behavior**: Optimal algorithm for each mode
- ✅ **Visual feedback**: Clear indication of button state and expected behavior
- ✅ **Edge case handling**: Graceful behavior in all scenarios
- ✅ **User understanding**: Tooltips clearly explain what will happen
- ✅ **No pointless actions**: Disabled when shuffle wouldn't change anything meaningful

## User Experience Benefits

1. **🎯 Purposeful Actions**: Never allow meaningless shuffle operations
2. **🔍 Clear Expectations**: Tooltips explain exactly what will happen
3. **⚡ Optimal Performance**: Different algorithms optimized for each scenario
4. **🎨 Visual Clarity**: Button state immediately indicates availability
5. **🧠 Smart Behavior**: System automatically chooses best approach
6. **📱 Responsive Design**: Adapts to any question pool configuration
7. **🛡️ Foolproof Generation**: Automatically clears locks before exam generation to prevent accidental question exclusion

## Lock Management During Generation

### **Auto-Clear Behavior**:
- **Pre-Generation Check**: System checks for any locked questions before generating exam
- **Automatic Clearing**: All locks are removed to ensure complete question inclusion
- **Explicit Visual Update**: UI immediately shows all questions as unlocked (removes orange highlighting)
- **User Notification**: Clear communication about what was cleared and why
- **Visual Warning**: Prominent note near generate button explaining the behavior

### **Why This Matters**:
- **Prevents Confusion**: Users might forget they have questions locked
- **Ensures Completeness**: All intended questions appear in final exam
- **Reduces Support Issues**: No "missing questions" problems
- **Clear Communication**: Users understand what's happening and why
