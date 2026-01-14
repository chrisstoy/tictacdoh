# Options Persistence Design

## Overview

Implement automatic persistence for user options (autoReplay, enableSound, enableMusic) using AsyncStorage. Options are saved immediately when changed and loaded automatically on app startup.

## Architecture

### Components

1. **Storage Key**: `@tic-tac-doh:options`
2. **Persistence Middleware**: Custom Zustand middleware that intercepts state changes
3. **Initialization Logic**: Loads persisted state before store creation

### Data Flow

**On Startup:**
```
AsyncStorage.getItem() → Parse JSON → Merge with defaults → Initialize Zustand store
```

**On Change:**
```
User calls setter → Zustand updates state → Middleware intercepts → AsyncStorage.setItem()
```

## Implementation Details

### Storage Format

Store only state properties (not action functions) as JSON:

```json
{
  "autoReplay": false,
  "enableSound": true,
  "enableMusic": true
}
```

### Persistence Middleware

The middleware will:
1. Load persisted values from AsyncStorage during initialization
2. Merge persisted values with defaults (defaults provide fallback for missing keys)
3. Wrap the `set` function to persist changes after each state update
4. Save the entire options object on each change

### Persistence Strategy

- **When to save**: Immediately on each setter call (setAutoReplay, setEnableSound, setEnableMusic)
- **What to save**: All three option values as a single JSON object
- **Where to save**: AsyncStorage with key `@tic-tac-doh:options`

## Error Handling

### Error Scenarios

1. **First launch** (no stored data)
   - AsyncStorage returns null
   - Use default values

2. **Corrupted JSON**
   - JSON.parse throws error
   - Log error to console
   - Use default values

3. **Partial data** (missing keys)
   - Spread defaults first, then stored values
   - Missing keys use defaults

4. **Storage write failure**
   - AsyncStorage.setItem fails
   - Log error to console
   - State still updates in memory (don't block UI)

5. **AsyncStorage unavailable**
   - Catch all errors
   - App continues with in-memory state only

### Error Recovery

All persistence operations use try-catch blocks. Failures are logged but never crash the app or prevent state updates.

## Performance Considerations

- AsyncStorage operations are fast (<10ms typically)
- JSON serialization of 3 booleans is negligible
- No throttling/debouncing needed (user changes are infrequent)
- Initial load is awaited to prevent race conditions

## Dependencies

- `@react-native-async-storage/async-storage` (needs to be installed)

## Testing Strategy

- Mock AsyncStorage in tests
- Verify state updates work even if persistence fails
- Test loading with various stored data states (null, corrupted, partial, valid)
- Verify default values are used appropriately

## File Changes

- `src/services/optionsState.ts` - Add persistence middleware and initialization
- `package.json` - Add async-storage dependency
