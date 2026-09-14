# Debug Session: OTP Request 500

Status: [OPEN]
Session: otp-request-500

## Symptom
`POST /api/auth/request-otp` returns HTTP 500.

## Hypotheses
1. Request body is missing or uses an unexpected email field.
2. No active `otpLogin` mailer exists for the active company.
3. SMTP configuration or credentials fail.
4. User lookup or database connectivity fails.
5. The request reaches a different backend/configuration than the edited source.

## Evidence

### Pre-fix
Pending runtime logs.

## Fix
Pending evidence.

## Verification
Pending user confirmation.
