import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_NAME = "CreatorBridge";
const PRIMARY_COLOR = "#6366f1";

const getTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: ${PRIMARY_COLOR}; padding: 30px; text-align: center; color: white; }
    .content { padding: 40px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; background: #f1f5f9; }
    .btn { display: inline-block; padding: 12px 24px; background: ${PRIMARY_COLOR}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
    h1 { margin: 0; font-size: 24px; }
    p { margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${APP_NAME}</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">${title}</h2>
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${APP_NAME} Enterprise. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

export const EmailService = {
  send: async (to, subject, title, htmlContent) => {
    try {
      await transporter.sendMail({
        from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: getTemplate(title, htmlContent),
      });
      return true;
    } catch (err) {
      console.error("Email error:", err);
      return false;
    }
  },

  sendWelcome: (user) => 
    EmailService.send(user.email, `Welcome to ${APP_NAME}!`, "Welcome aboard!", `
      <p>Hi ${user.name || user.username},</p>
      <p>We're thrilled to have you join ${APP_NAME}, the premier ecosystem for creators and brands.</p>
      <p>Start by completing your profile to unlock all features.</p>
      <a href="${process.env.CLIENT_URL}/onboarding" class="btn">Complete Profile</a>
    `),

  sendVerificationUpdate: (user, status, notes) =>
    EmailService.send(user.email, `Verification Update - ${APP_NAME}`, "Status: " + status.toUpperCase(), `
      <p>Hi ${user.name || user.username},</p>
      <p>Your verification request has been <strong>${status}</strong>.</p>
      ${notes ? `<p>Admin Notes: ${notes}</p>` : ""}
      <p>${status === 'approved' ? "You now have a blue badge on your profile!" : "You can try applying again after fixing the issues mentioned above."}</p>
    `),

  sendSubscriptionSuccess: (user, tier) =>
    EmailService.send(user.email, "Subscription Active!", "Premium Activated", `
      <p>Welcome to ${tier.toUpperCase()}!</p>
      <p>Your premium features are now active. Thank you for supporting the platform.</p>
      <a href="${process.env.CLIENT_URL}/premium" class="btn">View Benefits</a>
    `),

  sendDealInvitation: (user, dealName, brandName) =>
    EmailService.send(user.email, "New Deal Opportunity!", "Collaboration Invite", `
      <p>Brand <strong>${brandName}</strong> has invited you to collaborate on <strong>${dealName}</strong>.</p>
      <p>Check the details and respond in your dashboard.</p>
      <a href="${process.env.CLIENT_URL}/deals" class="btn">View Deal</a>
    `),

  sendSecurityAlert: (user, type) =>
    EmailService.send(user.email, "Security Alert", "Security Update", `
      <p>A new <strong>${type}</strong> was detected on your account.</p>
      <p>If this wasn't you, please reset your password immediately.</p>
      <a href="${process.env.CLIENT_URL}/settings" class="btn">Check Security</a>
    `),
};
