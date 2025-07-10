# Health Science System – Easy Instruction Manual

---

## Table of Contents

1. [What is This System?](#what-is-this-system)
2. [Who Can Use It? (User Roles)](#who-can-use-it-user-roles)
    - [Admin](#admin)
    - [Clinic](#clinic)
    - [Patient](#patient)
3. [How to Log In or Register](#how-to-log-in-or-register)
4. [How to Use the Dashboards](#how-to-use-the-dashboards)
    - [Admin Dashboard](#admin-dashboard)
    - [Clinic Dashboard](#clinic-dashboard)
    - [Patient Dashboard](#patient-dashboard)
5. [Subscriptions and Payments](#subscriptions-and-payments)
6. [Real-Time Features (Live Updates)](#real-time-features-live-updates)
7. [How to Get Around (Navigation & Design)](#how-to-get-around-navigation--design)
8. [Getting Help](#getting-help)
9. [Glossary (What Do These Words Mean?)](#glossary-what-do-these-words-mean)

---

## 1. What is This System?

The Health Science System is a website that helps clinics, patients, and administrators manage health information, subscriptions, and payments. It is designed to be easy to use, even if you are not familiar with computers or the internet.

---

## 2. Who Can Use It? (User Roles)

There are three types of users:

### Admin
- The person who manages the whole system.
- Can see and control all clinics, patients, and payments.

### Clinic
- The people who work at a clinic (like a doctor’s office).
- Can see their own clinic’s information, patients, and payments.

### Patient
- The people who visit the clinic.
- Can see their own health information and subscription status.

---

## 3. How to Log In or Register

**Logging in** means entering your username and password to use the system. **Registering** means creating a new account if you don’t have one yet.

### Step-by-Step: Registering
1. Open the website in your internet browser (like Chrome, Edge, or Safari).
2. If you are an admin, go to `/auth/admin/register`.
   - If you are a clinic, go to `/auth/clinic/register`.
   - If you are a patient, go to `/auth/patient/register`.
3. Fill in the form with your information (like your name, email, and a password you choose).
4. Click the “Register” or “Sign Up” button.
5. You may get a confirmation email. If so, open your email and follow the instructions.

### Step-by-Step: Logging In
1. Go to the login page for your role:
   - Admin: `/auth/admin/login`
   - Clinic: `/auth/clinic/login`
   - Patient: `/auth/patient/login`
2. Enter your email and password.
3. Click the “Login” or “Sign In” button.
4. If you forget your password, look for a “Forgot Password?” link and follow the steps.

---

## 4. How to Use the Dashboards

A **dashboard** is a page that shows you all the important information and actions you can take.

### Admin Dashboard
- Go to `/admin/dashboard` after logging in as an admin.
- You can see a list of all clinics, patients, and their subscriptions.
- You can add, edit, or remove clinics and patients.
- You can see payment and subscription status for everyone.

### Clinic Dashboard
- Go to `/clinic/dashboard` after logging in as a clinic.
- You can see your clinic’s patients and their information.
- You can manage your clinic’s subscriptions and payments.
- You can update your clinic’s details.

### Patient Dashboard
- Go to `/patient/dashboard` after logging in as a patient.
- You can see your own health information and subscription status.
- You can update your profile (like your name or contact info).

**Tip:** If you ever get lost, look for a menu or navigation bar at the top or side of the page. It will help you move between sections.

---

## 5. Subscriptions and Payments

A **subscription** means paying regularly (like every month) to use the clinic’s services.

### How to Start or Manage a Subscription
1. Go to the “Subscriptions” section in your dashboard.
2. Click on the button to start or manage your subscription.
3. Follow the instructions on the screen. You may need to enter payment details (like a credit card).
4. Payments are handled safely using a service called Stripe (a trusted payment company).
5. After payment, your subscription status will update automatically.

---

## 6. Real-Time Features (Live Updates)

Some information on the website updates automatically, without you needing to refresh the page. For example, if a new patient is added or a payment is made, you will see the change right away. This is called a **real-time feature** or **live update**.

---

## 7. How to Get Around (Navigation & Design)

- The website uses bright colors and clear buttons to make it easy to use.
- There is usually a menu at the top or side of the page to help you find what you need.
- Important information is shown in boxes or cards, sometimes with colored badges or icons.
- The website works on computers, tablets, and phones.
- If you see a button or link, you can click it to go to a new page or take an action.

---

## 8. Getting Help

- If you have trouble, look for a “Help” or “Support” section in your dashboard.
- You can also ask your clinic or system administrator for help.
- For technical issues, there may be a contact email or phone number provided by your clinic.

---

## 9. Glossary (What Do These Words Mean?)

- **Admin**: The person who manages the whole system.
- **Clinic**: The people who work at a clinic (like a doctor’s office).
- **Patient**: The people who visit the clinic.
- **Dashboard**: The main page where you see your information and actions.
- **Register**: Create a new account.
- **Login**: Enter your account to use the system.
- **Subscription**: Paying regularly to use services.
- **Payment**: Giving money for a service.
- **Stripe**: A safe company that handles online payments.
- **Real-Time/Live Update**: Information that changes automatically without refreshing the page.
- **Navigation/Menu**: The list of links or buttons to move around the website.

---

**Remember:** You don’t need to know anything about computers or the internet to use this system. Just follow the steps, and ask for help if you need it! 