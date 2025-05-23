import { format } from "date-fns"

interface SubscriptionEmailProps {
  userName: string
  plan: string
  storage: string
  startDate: Date
  endDate: Date
  duration: "6months" | "12months"
}

export function SubscriptionConfirmationEmail({
  userName,
  plan,
  storage,
  startDate,
  endDate,
  duration
}: SubscriptionEmailProps) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${plan} Plan!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding: 20px 0;
            background-color: #18181b;
            color: #ffffff;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 30px 20px;
          }
          .plan-details {
            background-color: #f8fafc;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .feature-list {
            list-style: none;
            padding: 0;
            margin: 20px 0;
          }
          .feature-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .feature-list li:last-child {
            border-bottom: none;
          }
          .feature-list li:before {
            content: "✓";
            color: #2563eb;
            margin-right: 8px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .highlight {
            color: #2563eb;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${plan} Plan!</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            
            <p>Thank you for upgrading to our ${plan} Plan! We're excited to have you on board and can't wait to see what you'll create with your expanded storage space.</p>
            
            <div class="plan-details">
              <h2>Your Subscription Details:</h2>
              <ul>
                <li><strong>Plan:</strong> <span class="highlight">${plan}</span></li>
                <li><strong>Storage:</strong> <span class="highlight">${storage}</span></li>
                <li><strong>Duration:</strong> ${duration === "6months" ? "6 Months" : "12 Months"}</li>
                <li><strong>Start Date:</strong> ${format(startDate, "MMMM d, yyyy")}</li>
                <li><strong>End Date:</strong> ${format(endDate, "MMMM d, yyyy")}</li>
              </ul>
            </div>

            <h3>Your New Features:</h3>
            <ul class="feature-list">
              <li>${storage} of storage space for your photos and videos</li>
              <li>Advanced face detection and recognition</li>
              <li>Priority support and faster processing</li>
              <li>Custom albums and advanced organization tools</li>
              <li>Bulk operations and batch processing</li>
              ${plan === "Enterprise" ? `
              <li>API access for custom integrations</li>
              <li>Dedicated account manager</li>
              <li>Custom feature development</li>
              ` : ""}
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/upload" class="button">
                Start Uploading Now
              </a>
            </div>

            <p>Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/help" style="color: #2563eb;">help center</a> or contact our support team.</p>

            <p>If you have any questions about your subscription or need assistance, please don't hesitate to contact our support team at <a href="mailto:support@facevault.com" style="color: #2563eb;">support@facevault.com</a>.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FaceVault. All rights reserved.</p>
            <p>This is an automated message, please do not reply directly to this email.</p>
            <p>To manage your email preferences, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #2563eb;">account settings</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `
} 