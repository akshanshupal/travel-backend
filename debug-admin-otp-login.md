# Debug Session: Admin OTP Login

Status: [OPEN]
Session: admin-otp-login

## Goal
Verify ADMIN authentication bypass, OTP login for `akshanshupal@gmail.com`, and lead-management page access.

## Hypotheses
1. ADMIN users are not bypassing permission checks consistently.
2. OTP request or verification is failing before authentication completes.
3. OTP storage/delivery is failing in the backend.
4. Successful OTP verification does not establish token or active company state.
5. A remaining lead-management route or lookup contract is failing after login.

## Evidence
- `POST /api/auth/request-otp` for `akshanshupal@gmail.com` returned HTTP 500 with: `OTP email is not configured. Add an active mailer with emailFunction "otpLogin".`
- Local MongoDB query against `mongodb://127.0.0.1:27017/travel?authSource=admin` returned zero records for `{ emailFunction: "otpLogin" }`.
- `hasPermission` already bypasses permissions for `ADMIN` users.
- OTP values are not stored in plaintext; the controller stores only a SHA-256 hash in Redis, so the OTP cannot be read back from the backend.

## Changes
No business logic changes made during initial evidence collection.
