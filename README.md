# Health Support System Frontend

This is the frontend application for the Health Support System, a subscription-based platform for health-related services.

## Features

- Three-party user system (Patients, Clinics, Admin)
- Subscription plan management
- Real-time tracking of patient enrollments
- Commission and fee structure management
- Responsive design for mobile and desktop

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- React

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── components/     # Reusable components
├── pages/         # Next.js pages
│   ├── auth/      # Authentication pages
│   └── dashboard/ # Dashboard pages for each user type
├── styles/        # Global styles
└── public/        # Static assets
```

## User Types

1. **Patients**
   - Register and login
   - Browse and select subscription plans
   - View subscription status and payment history

2. **Clinics**
   - Register and login
   - View patient referrals
   - Track commission earnings
   - Manage patient subscriptions

3. **Admin**
   - Login (no registration)
   - Monitor all subscriptions
   - Track revenue and commissions
   - Manage clinic partners

## Development

- The project uses TypeScript for type safety
- Tailwind CSS for styling
- Follows Next.js best practices
- Implements responsive design principles

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is proprietary and confidential. 