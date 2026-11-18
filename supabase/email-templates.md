# Email templates

Paste each template into the Supabase console under Authentication, Email Templates.
The links point at the site's set-password page with a one-time code. The page shows a
button and only uses the code when the person presses it, so email scanners that
pre-open links cannot use it up.

Also set the subject lines shown below. Keep the `{{ ... }}` parts exactly as written.

## Invite user

Console screen: Authentication, Email Templates, "Invite user".
Suggested subject: You're invited to your client area

```html
<h2>You're invited</h2>
<p>Hello, your private client area is ready. Press the link below to choose your password.</p>
<p><a href="{{ .SiteURL }}/set-password.html?token_hash={{ .TokenHash }}&type=invite">Set your password</a></p>
<p>If you weren't expecting this, you can simply ignore this email.</p>
```

## Reset password

Console screen: Authentication, Email Templates, "Reset password".
Suggested subject: Choose a new password

```html
<h2>Choose a new password</h2>
<p>We got a request to reset your password. Press the link below to pick a new one.</p>
<p><a href="{{ .SiteURL }}/set-password.html?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a></p>
<p>If you didn't ask for this, you can ignore this email and nothing will change.</p>
```
