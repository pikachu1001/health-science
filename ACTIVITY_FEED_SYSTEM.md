# Enhanced Activity Feed System

## Overview

The Enhanced Activity Feed System provides detailed, personalized activity tracking for the Health Science platform. It automatically creates meaningful messages that specify who performed what action, making it easy to track user activities across the system.

## Features

### 🎯 Personalized Messages
- **User Names**: Activities include actual user names (patients and clinics)
- **Specific Actions**: Clear descriptions of what was performed
- **Context Details**: Additional information like plan names, amounts, and clinic associations

### 📊 Activity Types

#### 1. New Signup (`new_signup`)
- **Patient Registration**: `"田中太郎が新規患者として登録しました。"`
- **Clinic Registration**: `"佐藤クリニックが新規クリニックとして登録しました。"`
- **Subscription Signup**: `"田中太郎がプレミアムプランに登録しました。"`

#### 2. Payment Events
- **Base Fee Payment**: `"佐藤クリニックが基本料金を支払いました。"`
- **Payment Failure**: `"山田花子のベーシックプラン支払いが失敗しました。リマインダーを送信しました。"`
- **Subscription Cancellation**: `"鈴木一郎のスタンダードプランがキャンセルされました。"`

### 🔧 Technical Implementation

#### Data Structure
```typescript
interface ActivityFeed {
  activityId: string;
  type: 'new_signup' | 'payment_success' | 'payment_failed' | 'base_fee_paid' | 'subscription_cancelled';
  userId: string;
  clinicId: string;
  message: string;
  timestamp: any; // Firestore Timestamp
  details?: {
    plan?: string;
    planId?: string;
    amount?: number;
    patientName?: string;
    patientId?: string;
    clinicName?: string;
    clinicId?: string;
  };
}
```

#### Message Format Examples
```
Format: "{userName}が{action}しました。"
Examples:
- "田中太郎が新規患者として登録しました。"
- "田中太郎がプレミアムプランに登録しました。"
- "佐藤クリニックが基本料金を支払いました。"
- "山田花子のベーシックプラン支払いが失敗しました。"
```

## Implementation Details

### 1. Stripe Webhook Integration (`pages/api/stripe/webhook.js`)

The webhook handler automatically creates activity feed entries for payment events:

```javascript
// Enhanced with user and clinic details
const userDetails = await getUserDetails(userId);
const clinicDetails = await getClinicDetails(clinicId);

const patientName = userDetails ? `${userDetails.lastName}${userDetails.firstName}` : 'Unknown Patient';
const clinicName = clinicDetails ? clinicDetails.clinicName : 'Unknown Clinic';

// Create detailed activity message
message: `${patientName}が${plan.name}に登録しました。`
```

### 2. User Registration Integration (`contexts/AuthContext.tsx`)

User registration automatically creates activity feed entries:

```typescript
// Automatically called during signup
await createUserRegistrationActivity(user.uid, role, details);
```

### 3. Helper Functions (`lib/authHelpers.ts`)

Utility functions for creating activity feed entries:

```typescript
// Create any activity feed entry
await createActivityFeedEntry({
  type: 'new_signup',
  userId: userId,
  clinicId: clinicId,
  message: `${patientName}が新規患者として登録しました。`,
  details: {
    patientName: patientName,
    patientId: userId,
    clinicName: clinicName,
    clinicId: clinicId
  }
});
```

### 4. Real-Time Display (`pages/admin/dashboard.tsx`)

Enhanced display with additional context information:

```typescript
// Enhanced message with additional info
let additionalInfo = '';
if (details.patientName && details.clinicName) {
  additionalInfo = `患者: ${details.patientName} | クリニック: ${details.clinicName}`;
}
if (details.amount && details.amount !== 'base_fee') {
  additionalInfo += ` | 金額: ¥${details.amount.toLocaleString()}`;
}
```

## Usage Examples

### Testing the System

1. **Create Test Activities**:
   ```bash
   npm run test-activity-feed test
   ```

2. **Clean Up Test Data**:
   ```bash
   npm run test-activity-feed cleanup
   ```

### Manual Activity Creation

```typescript
import { createActivityFeedEntry } from '../lib/authHelpers';

// Create a custom activity
await createActivityFeedEntry({
  type: 'new_signup',
  userId: 'user123',
  clinicId: 'clinic456',
  message: '田中太郎がプレミアムプランに登録しました。',
  details: {
    plan: 'プレミアムプラン',
    amount: 15000,
    patientName: '田中太郎',
    clinicName: '佐藤クリニック'
  }
});
```

## Real-Time Features

### Live Updates
- Activities appear in real-time across admin and clinic dashboards
- No page refresh required
- Automatic timestamp tracking

### Filtering
- Filter by clinic ID for clinic-specific views
- Filter by activity type
- Sort by timestamp (newest first)

### Visual Indicators
- Color-coded activity types
- Icons for different activity categories
- Additional context information in parentheses

## Message Templates

### Patient Activities
- Registration: `"{patientName}が新規患者として登録しました。"`
- Subscription: `"{patientName}が{planName}に登録しました。"`
- Payment Failure: `"{patientName}の{planName}支払いが失敗しました。"`
- Cancellation: `"{patientName}の{planName}がキャンセルされました。"`

### Clinic Activities
- Registration: `"{clinicName}が新規クリニックとして登録しました。"`
- Base Fee: `"{clinicName}が基本料金を支払いました。"`

## Benefits

1. **Clear Accountability**: Know exactly who performed what action
2. **Better Tracking**: Detailed context for each activity
3. **Improved UX**: Meaningful messages instead of generic text
4. **Audit Trail**: Complete history of user actions
5. **Real-Time Monitoring**: Live updates for immediate awareness

## Future Enhancements

1. **Email Notifications**: Send activity summaries via email
2. **Activity Analytics**: Track patterns and trends
3. **Custom Filters**: Advanced filtering and search
4. **Export Functionality**: Export activity logs for reporting
5. **Activity Categories**: Group activities by business function

## Security Considerations

- All activities respect Firestore security rules
- User data is properly sanitized before display
- Sensitive information is not exposed in activity messages
- Authentication state is verified before creating activities 