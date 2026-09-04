const APP_NAME = process.env.APP_NAME || "Rollnexa";
const APP_URL = process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatName(name: string | null | undefined) {
  const safe = name?.trim();
  return safe && safe.length > 0 ? safe : "there";
}

function renderEmailTemplate(params: {
  title: string;
  previewText: string;
  greeting: string;
  intro: string;
  ctaLabel?: string;
  ctaUrl?: string;
  highlightTitle?: string;
  highlightBody?: string;
  bulletPoints?: Array<{ label: string; value: string }>;
  footerNote?: string;
}) {
  const content = [] as string[];
  content.push(`<p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#475569;">${escapeHtml(params.intro)}</p>`);

  if (params.highlightTitle || params.highlightBody) {
    content.push(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 24px;">
        <tr>
          <td style="background:#fff7ed; border:1px solid #fdba74; border-radius:12px; padding:20px;">
            <p style="margin:0 0 8px; font-size:12px; letter-spacing:0.16em; text-transform:uppercase; color:#c2410c; font-weight:700;">${escapeHtml(params.highlightTitle || "Update")}</p>
            <p style="margin:0; font-size:15px; line-height:1.6; color:#9a2c0d;">${escapeHtml(params.highlightBody || "")}</p>
          </td>
        </tr>
      </table>`);
  }

  if (params.bulletPoints?.length) {
    content.push(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">
        <tbody>`);
    for (const bullet of params.bulletPoints) {
      content.push(`
        <tr>
          <td style="padding:6px 0; font-size:14px; color:#334155;">
            <strong>${escapeHtml(bullet.label)}:</strong> ${escapeHtml(bullet.value)}
          </td>
        </tr>`);
    }
    content.push(`</tbody></table>`);
  }

  if (params.ctaLabel && params.ctaUrl) {
    content.push(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0;">
        <tr>
          <td>
            <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block; padding:12px 18px; border-radius:999px; background:#f59e0b; color:#111827; text-decoration:none; font-weight:700; font-size:14px;">${escapeHtml(params.ctaLabel)}</a>
          </td>
        </tr>
      </table>`);
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(params.title)}</title>
  </head>
  <body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 10px 40px rgba(15,23,42,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg, #111827 0%, #1f2937 100%); padding:28px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:24px; font-weight:700; color:#ffffff;">${escapeHtml(APP_NAME)}</td>
                    <td align="right" style="font-size:12px; color:#f9fafb;">Marketplace that moves fast</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px; font-size:12px; letter-spacing:0.16em; text-transform:uppercase; color:#f59e0b; font-weight:700;">${escapeHtml(params.previewText)}</p>
                <h1 style="margin:0 0 12px; font-size:24px; line-height:1.3; color:#111827;">${escapeHtml(params.title)}</h1>
                <p style="margin:0 0 16px; font-size:16px; line-height:1.7; color:#334155;">${escapeHtml(params.greeting)}</p>
                ${content.join("\n")}
                <p style="margin:24px 0 0; font-size:14px; line-height:1.7; color:#64748b;">${escapeHtml(params.footerNote || `Thank you for choosing ${APP_NAME}.`)}</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:12px; color:#64748b; line-height:1.6;">
                      <strong>${escapeHtml(APP_NAME)}</strong><br />
                      ${escapeHtml(APP_URL)}
                    </td>
                    <td align="right" style="font-size:12px; color:#64748b; line-height:1.6;">
                      Follow along at <a href="${escapeHtml(APP_URL)}" style="color:#f59e0b; text-decoration:none;">${escapeHtml(APP_URL)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderWelcomeEmailTemplate(params: { userName: string; accountType: string }) {
  const fullName = formatName(params.userName);
  const accountType = params.accountType?.toUpperCase() || "BUYER";
  return renderEmailTemplate({
    title: `Welcome to ${APP_NAME}!`,
    previewText: "Your account is ready",
    greeting: `Hi ${escapeHtml(fullName)}, welcome aboard!`,
    intro: `Your ${escapeHtml(accountType)} account is now active. You can log in anytime to manage listings, conversations, and marketplace activity.`,
    ctaLabel: "Log in to your account",
    ctaUrl: `${APP_URL}/login`,
    highlightTitle: "What you can do next",
    highlightBody: "Browse machines, connect with sellers, manage your profile, and stay on top of everything happening in Rollnexa.",
    bulletPoints: [
      { label: "Account type", value: accountType },
      { label: "Website", value: APP_URL },
    ],
    footerNote: `Thanks for joining ${APP_NAME}. We are excited to help you get started.`,
  });
}

export function renderVerificationEmailTemplate(params: { userName: string; verificationUrl: string }) {
  const fullName = formatName(params.userName);
  return renderEmailTemplate({
    title: "Verify your email address",
    previewText: "Secure your account",
    greeting: `Hi ${escapeHtml(fullName)},`,
    intro: "Please verify your email address to secure your account and unlock the full Rollnexa experience.",
    ctaLabel: "Verify email",
    ctaUrl: params.verificationUrl,
    highlightTitle: "Important",
    highlightBody: "This verification link expires in 24 hours. If you did not create an account with Rollnexa, you can ignore this email.",
    bulletPoints: [
      { label: "Expires", value: "24 hours" },
      { label: "Security", value: "Use the secure verification link above" },
    ],
    footerNote: "We never share your email or account details.",
  });
}

export function renderPasswordResetEmailTemplate(params: { userName: string; resetUrl: string }) {
  const fullName = formatName(params.userName);
  return renderEmailTemplate({
    title: "Reset your password",
    previewText: "Secure password reset",
    greeting: `Hi ${escapeHtml(fullName)},`,
    intro: "A password reset was requested for your Rollnexa account. Use the secure link below to choose a new password.",
    ctaLabel: "Reset password",
    ctaUrl: params.resetUrl,
    highlightTitle: "Security notice",
    highlightBody: "If you did not request this change, you can safely ignore this message. Your password will remain unchanged until you complete the reset flow.",
    bulletPoints: [
      { label: "Expires", value: "1 hour" },
      { label: "Security", value: "Use the secure reset link above" },
    ],
    footerNote: "Never share your password with anyone.",
  });
}

export function renderInquiryEmailTemplate(params: {
  sellerName: string;
  buyerName: string;
  machineName: string;
  message: string;
  replyUrl: string;
}) {
  return renderEmailTemplate({
    title: "You received a new inquiry",
    previewText: "New buyer inquiry",
    greeting: `Hello ${escapeHtml(params.sellerName)},`,
    intro: `A buyer named ${escapeHtml(params.buyerName)} sent an inquiry regarding your listing for ${escapeHtml(params.machineName)}.`,
    ctaLabel: "Reply to inquiry",
    ctaUrl: params.replyUrl,
    highlightTitle: "Buyer message",
    highlightBody: params.message,
    bulletPoints: [
      { label: "Machine", value: params.machineName },
      { label: "Buyer", value: params.buyerName },
    ],
    footerNote: "Reply promptly to keep the conversation moving.",
  });
}

export function renderMessageEmailTemplate(params: {
  recipientName: string;
  senderName: string;
  preview: string;
  conversationUrl: string;
}) {
  return renderEmailTemplate({
    title: "You have a new message",
    previewText: "New message received",
    greeting: `Hello ${escapeHtml(params.recipientName)},`,
    intro: `${escapeHtml(params.senderName)} sent you a new message.`,
    ctaLabel: "Open conversation",
    ctaUrl: params.conversationUrl,
    highlightTitle: "Conversation preview",
    highlightBody: params.preview,
    bulletPoints: [
      { label: "Sender", value: params.senderName },
      { label: "Inbox", value: "Open the conversation" },
    ],
    footerNote: "Stay connected and reply when you are ready.",
  });
}

export function renderListingApprovedEmailTemplate(params: {
  sellerName: string;
  machineName: string;
  listingUrl: string;
}) {
  return renderEmailTemplate({
    title: "Your listing is now live",
    previewText: "Listing approved",
    greeting: `Hello ${escapeHtml(params.sellerName)},`,
    intro: `Your listing for ${escapeHtml(params.machineName)} has been approved and is now published in the marketplace.`,
    ctaLabel: "View listing",
    ctaUrl: params.listingUrl,
    highlightTitle: "Approval confirmed",
    highlightBody: "Your machine listing is now visible to buyers and ready for inquiries.",
    bulletPoints: [{ label: "Machine", value: params.machineName }],
    footerNote: "Keep your listing fresh and updated to attract more buyers.",
  });
}

export function renderListingRejectedEmailTemplate(params: {
  sellerName: string;
  machineName: string;
  rejectionReason: string;
  editUrl: string;
}) {
  return renderEmailTemplate({
    title: "Listing update required",
    previewText: "Listing rejected",
    greeting: `Hello ${escapeHtml(params.sellerName)},`,
    intro: `Your listing for ${escapeHtml(params.machineName)} requires updates before it can be published.`,
    ctaLabel: "Edit listing",
    ctaUrl: params.editUrl,
    highlightTitle: "Admin feedback",
    highlightBody: params.rejectionReason,
    bulletPoints: [{ label: "Machine", value: params.machineName }],
    footerNote: "Make the requested adjustments and resubmit when ready.",
  });
}

export function renderPaymentReceiptEmailTemplate(params: {
  sellerName: string;
  transactionId: string;
  invoiceNumber: string;
  planName: string;
  amount: string;
  paymentDate: string;
  receiptUrl: string;
}) {
  return renderEmailTemplate({
    title: "Payment receipt received",
    previewText: "Payment confirmation",
    greeting: `Hello ${escapeHtml(params.sellerName)},`,
    intro: "Your payment was received successfully. Your receipt and billing details are ready below.",
    ctaLabel: "Download receipt",
    ctaUrl: params.receiptUrl,
    highlightTitle: "Invoice details",
    highlightBody: "Your subscription payment is confirmed and your invoice has been generated.",
    bulletPoints: [
      { label: "Transaction ID", value: params.transactionId },
      { label: "Invoice", value: params.invoiceNumber },
      { label: "Plan", value: params.planName },
      { label: "Amount", value: params.amount },
      { label: "Paid on", value: params.paymentDate },
    ],
    footerNote: "Keep this receipt for your records.",
  });
}

export function renderSubscriptionReminderEmailTemplate(params: {
  sellerName: string;
  planName: string;
  expiryDate: string;
  renewUrl: string;
}) {
  return renderEmailTemplate({
    title: "Your subscription is expiring soon",
    previewText: "Renew your plan",
    greeting: `Hello ${escapeHtml(params.sellerName)},`,
    intro: `Your ${escapeHtml(params.planName)} subscription is nearing its expiry date. Renew now to keep your marketplace benefits active.`,
    ctaLabel: "Renew now",
    ctaUrl: params.renewUrl,
    highlightTitle: "Plan details",
    highlightBody: `Your current plan will expire on ${escapeHtml(params.expiryDate)}.`,
    bulletPoints: [
      { label: "Plan", value: params.planName },
      { label: "Expiry", value: params.expiryDate },
    ],
    footerNote: "Renewing early helps you avoid interruptions.",
  });
}

export function renderAnnouncementEmailTemplate(params: {
  recipientName: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  return renderEmailTemplate({
    title: params.title,
    previewText: "Admin announcement",
    greeting: `Hello ${escapeHtml(params.recipientName)},`,
    intro: params.description,
    ctaLabel: params.ctaLabel || "Read more",
    ctaUrl: params.ctaUrl,
    highlightTitle: "Important update",
    highlightBody: "This announcement was sent by the Rollnexa administration team.",
    footerNote: "Thanks for staying connected with Rollnexa.",
  });
}
