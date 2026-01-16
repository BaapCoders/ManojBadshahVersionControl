# Adobe Express Add-on Dialog Migration

## Summary
All `alert()` statements in the react-client have been replaced with proper Adobe Express modal dialogs using the `addOnUISdk.app.showModalDialog()` API.

## Why This Change Was Necessary

Standard JavaScript `alert()` does **NOT** work reliably in Adobe Express Add-ons because:
- Add-ons run in a sandboxed iframe environment
- Browser alerts may be blocked by the host application
- The user experience is poor with native browser alerts
- Adobe provides a better UX through their modal dialog system

## Files Changed

### 1. **New Utility File Created**
- `react-client/src/utils/dialogUtils.ts`
  - `showSuccessDialog()` - For success messages
  - `showErrorDialog()` - For error messages
  - `showWarningDialog()` - For warning messages
  - `showInfoDialog()` - For informational messages
  - `showConfirmDialog()` - For confirmation prompts (returns boolean)

### 2. **Updated Page Components**
- `react-client/src/pages/GeneratePage.tsx` (5 alerts replaced)
- `react-client/src/pages/InboxPage.tsx` (3 alerts replaced)
- `react-client/src/pages/FeedPage.tsx` (5 alerts replaced)

## Dialog Variants Used

According to Adobe Express documentation, the following dialog variants are available:

1. **confirmation** - Ask user to confirm an action
2. **information** - Share information for user to acknowledge
3. **warning** - Information user needs to consider before proceeding
4. **destructive** - Warns user about actions that may impact data negatively
5. **error** - Communicate critical issues that need resolution
6. **input** - Ask user to provide input
7. **custom** - Render complex forms and content

## Example Usage

### Before (❌ Don't use):
```typescript
alert('✅ Version saved successfully!');
alert('❌ Failed to save');
```

### After (✅ Use this):
```typescript
import { showSuccessDialog, showErrorDialog } from '../utils/dialogUtils';

await showSuccessDialog('Version saved successfully!');
await showErrorDialog('Failed to save');
```

## Key Benefits

1. ✅ **Works reliably** in Adobe Express Add-on environment
2. ✅ **Better UX** - Consistent with Adobe Express design system
3. ✅ **Non-blocking** - Doesn't interrupt workflow unnecessarily
4. ✅ **Fallback handling** - Logs to console if dialog fails
5. ✅ **Type-safe** - Full TypeScript support

## References

- [Adobe Express Modal Dialogs Documentation](https://developer.adobe.com/express/add-ons/docs/guides/learn/how_to/modal_dialogs)
- [UX Guidelines - Feedback & Messaging](https://developer.adobe.com/express/add-ons/docs/guides/build/design/ux_guidelines/feedback_and_messaging)
- [Usability Guidelines](https://developer.adobe.com/express/add-ons/docs/guides/build/distribute/guidelines/general/usability)

## Important Notes

- All dialog functions are `async` and should be `await`ed
- Dialog functions automatically wait for `addOnUISdk.ready`
- Console fallbacks are provided for development/debugging
- Modal dialogs should not interrupt workflow unnecessarily (per Adobe guidelines)
