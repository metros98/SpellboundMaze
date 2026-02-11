# Tricky Letters Feature - Implementation Documentation

## Overview
This feature replaces random extra letters in Medium and Hard difficulty modes with strategically confusing "tricky" letters based on commonly confused letter sounds. This makes the game more educational by helping children distinguish between letters that actually sound similar.

## Changes Made

### 1. Type Definitions (`types.ts`)
Added `trickyLettersEnabled?: boolean` field to the `Settings` interface.
- **Location**: [react-app/src/types.ts](react-app/src/types.ts)
- **Default**: `false` (preserves existing behavior)
- **Purpose**: Controls whether tricky letters are used instead of random letters

### 2. Game Core Logic (`gameCore.js`)
Implemented the tricky letter generation logic in the main game module.

#### Changes:
1. **Added Configuration Field**
   - Added `trickyLettersEnabled: false` to the `config` object
   - This can be set via `setConfig()` method

2. **Added Confusion Map**
   ```javascript
   const TRICKY_LETTER_MAP = {
     'S': 'C',
     'C': 'K',
     'G': 'J',
     'A': 'E',
     'E': 'A'
   };
   ```

3. **Added `getTrickyLetters()` Function**
   - Takes a word and returns an array of tricky letter candidates
   - Automatically excludes letters already in the word
   - Each letter instance in the word produces at most one tricky candidate
   - Case-insensitive operation

4. **Modified `prepareLevelFor()` Function**
   - Updated extra letter generation logic to prioritize tricky letters when enabled
   - Falls back to random letters if not enough tricky candidates exist
   - When setting is disabled, uses existing random letter behavior

## How It Works

### Tricky Letter Generation Algorithm

1. **Extract word letters**: Split the word and convert to uppercase
2. **Create word set**: Track which letters are already in the word
3. **Generate candidates**: For each letter in the word:
   - Look up the tricky letter from the confusion map
   - Only include if the tricky letter is NOT already in the word
   - Add to candidates list (allowing duplicates from repeated letters)

4. **Select tricky letters**:
   - Shuffle the tricky candidates
   - Take up to the number of extra letter slots for the difficulty
   - Fill remaining slots with random letters

### Examples

#### Example 1: "SPACE" (Medium: 2 extra letters)
- Letters: S, P, A, C, E
- Tricky candidates:
  - S → C (skipped, C already in word)
  - A → E (skipped, E already in word)
  - C → K ✓
  - E → A (skipped, A already in word)
- Result: 1 tricky letter (K) + 1 random letter

#### Example 2: "GLASS" (Hard: 5 extra letters)
- Letters: G, L, A, S, S
- Tricky candidates:
  - G → J ✓
  - A → E ✓
  - S → C ✓
  - S → C ✓ (second S generates second C)
- Result: 4 tricky letters (J, E, C, C) + 1 random letter

#### Example 3: "BIG" (Medium: 2 extra letters)
- Letters: B, I, G
- Tricky candidates:
  - G → J ✓
- Result: 1 tricky letter (J) + 1 random letter

## Testing

A comprehensive test suite was created to verify the implementation:
- **Location**: [react-app/src/lib/trickyLetters.test.js](react-app/src/lib/trickyLetters.test.js)
- **Run**: `node trickyLetters.test.js`

### Test Coverage
✓ Tricky letter generation for various words
✓ Skip-when-duplicate logic
✓ Extra letter count validation
✓ Fallback to random letters
✓ Setting enabled/disabled behavior
✓ Case insensitivity
✓ Edge cases (no tricky candidates, all candidates, etc.)

All 10 tests pass successfully.

## Usage

### From React Components
```typescript
import { setConfig } from './lib/gameAdapter';

// Enable tricky letters
await setConfig({
  trickyLettersEnabled: true,
  difficulty: 'medium' // or 'hard'
});
```

### From Game Core Directly
```javascript
import { setConfig } from './lib/gameCore';

setConfig({
  trickyLettersEnabled: true,
  difficulty: 'medium'
});
```

## Configuration

### Easy Mode
- No extra letters (unchanged)
- Tricky letters setting has no effect

### Medium Mode
- 2 extra letters
- When enabled: prioritizes up to 2 tricky letters
- When disabled: uses 2 random letters

### Hard Mode
- 5 extra letters
- When enabled: prioritizes up to 5 tricky letters
- When disabled: uses 5 random letters

## Future Enhancements (Out of Scope)

- [ ] Settings UI toggle (separate branch)
- [ ] Additional confusion pairs (e.g., F↔PH, I↔Y, etc.)
- [ ] Difficulty-specific confusion maps
- [ ] Sound-based confusion beyond single letters
- [ ] Analytics to track which letter pairs cause the most confusion

## Backward Compatibility

- **Default behavior**: Setting defaults to `false`, preserving existing random letter behavior
- **No breaking changes**: All existing functionality remains unchanged when setting is disabled
- **Graceful degradation**: If the setting field is missing/undefined, it's treated as `false`

## Files Modified

1. [react-app/src/types.ts](react-app/src/types.ts) - Added `trickyLettersEnabled` to Settings interface
2. [react-app/src/lib/gameCore.js](react-app/src/lib/gameCore.js) - Implemented tricky letter logic

## Files Created

1. [react-app/src/lib/trickyLetters.test.js](react-app/src/lib/trickyLetters.test.js) - Unit tests for tricky letter functionality
