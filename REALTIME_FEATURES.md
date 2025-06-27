# Real-Time Dashboard Features

## Overview

The clinic dashboard now features real-time updates using Firestore's `onSnapshot` listeners. This means data updates automatically without requiring page refreshes.

## Features Implemented

### 1. Real-Time Statistics
- **Total Patients**: Updates when new patients register
- **Today's Appointments**: Updates when appointments are created/cancelled
- **Pending Appointments**: Updates when appointment status changes
- **Monthly Revenue**: Updates when payments are processed
- **Active Subscriptions**: Updates when subscription status changes
- **Pending Insurance Claims**: Updates when claims are submitted/processed

### 2. Real-Time Data Sections
- **Appointments**: Live updates for today's appointments
- **Patients**: Recent patient list with live updates
- **Activity Log**: Real-time activity feed showing recent actions

### 3. Visual Indicators
- **Live Update Indicator**: Green pulsing dot with "ライブ更新中" text
- **Loading States**: Shows "(更新中...)" when data is being fetched
- **Empty States**: Graceful handling when no data is available

## Technical Implementation

### Hooks Used
```typescript
// Real-time data hooks
useClinicAppointments(clinicId, limitCount)
useClinicPatients(clinicId, limitCount)
useClinicDashboardStats(clinicId)
useClinicActivityLog(clinicId, limitCount)
```

### Firestore Collections Monitored
- `appointments` - Patient appointments
- `patients` - Patient records
- `subscriptions` - Patient subscriptions
- `insuranceClaims` - Insurance claim records
- `activityLogs` - System activity tracking

### Data Structure
Each real-time hook returns:
```typescript
{
  data: T[],           // The actual data
  loading: boolean,    // Loading state
  error: string | null // Error message if any
}
```

## Testing Real-Time Features

### 1. Using the Test Script
```bash
# Add test data
node scripts/test-realtime.js add

# Clean up test data
node scripts/test-realtime.js cleanup
```

### 2. Manual Testing
1. Open the clinic dashboard
2. Look for the green "ライブ更新中" indicator
3. Add data to Firestore collections manually
4. Watch for automatic updates in the dashboard

### 3. Expected Behavior
- **Immediate Updates**: Changes should appear within 1-2 seconds
- **No Page Refresh**: Data updates without reloading the page
- **Loading States**: Shows loading indicators during initial fetch
- **Error Handling**: Gracefully handles connection issues

## Performance Considerations

### Optimizations
- **Limit Queries**: All queries use `limit()` to prevent excessive data loading
- **Efficient Listeners**: Multiple listeners are properly cleaned up on component unmount
- **Debounced Updates**: Stats are calculated efficiently using multiple listeners

### Monitoring
- **Connection Status**: Real-time indicators show when listeners are active
- **Error Logging**: Console errors are logged for debugging
- **Memory Management**: Listeners are properly unsubscribed

## Future Enhancements

### Planned Features
1. **Admin Dashboard**: Real-time system-wide statistics
2. **Patient Dashboard**: Live health record updates
3. **Notifications**: Real-time push notifications for important events
4. **Offline Support**: Cached data with sync when online

### Advanced Features
1. **WebSocket Fallback**: Alternative to Firestore for better performance
2. **Data Compression**: Optimize data transfer for large datasets
3. **Selective Updates**: Only update changed fields instead of entire documents

## Troubleshooting

### Common Issues
1. **No Updates**: Check Firestore security rules
2. **Slow Updates**: Verify network connection
3. **Memory Leaks**: Ensure listeners are properly cleaned up

### Debug Mode
Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'firebase:*');
```

## Security Notes

- All real-time listeners respect Firestore security rules
- Data is filtered by `clinicId` to ensure clinic isolation
- Sensitive data is not exposed through real-time listeners
- Authentication state is verified before establishing listeners 