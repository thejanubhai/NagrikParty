import { brandShell, EMAIL_LOGO_PNG } from "./email";

function ctaButton(url: string, label: string): string {
  return `<p style="margin:22px 0;"><a href="${url}" style="display:inline-block;background:#1d5635;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:3px;">${label}</a></p>`;
}
function detailRow(label: string, value: string): string {
  return `<div style="padding:7px 0;border-bottom:1px solid #eee7d3;font-size:13.5px;"><span style="color:#8a7f63;">${label}: </span><strong style="color:#14161a;">${value}</strong></div>`;
}

export function donationReceiptEmail(opts: {
  donorName: string; amountInr: string; utr: string; date: string; ledgerUrl?: string;
}): { subject: string; html: string } {
  return {
    subject: `Nagrik Party: Donation Receipt Rs.${opts.amountInr} (UTR ${opts.utr.slice(-6)})`,
    html: brandShell("Donation Received, Dhanyavaad",
      `<p>Namaste ${opts.donorName},</p>
<p>Aapke yogdaan ke liye dhanyavaad. Ye receipt aapke digital donation ki pushti karti hai:</p>
<div style="background:#faf7ef;border:1px solid #e3dccb;border-radius:3px;padding:12px 16px;margin:16px 0;">
${detailRow("Amount", "Rs." + opts.amountInr)}
${detailRow("UTR / Reference", opts.utr)}
${detailRow("Date", opts.date)}
${detailRow("Account", "SHEIKH ARSALAN ULLAH CHISHTI, Axis Bank Current A/c")}
</div>
<p>Aapka yogdaan <strong>public transparency ledger</strong> me darj hoga. Statements har 6 mahine me public release hote hain. 100% digital, zero cash.</p>
${ctaButton(opts.ledgerUrl || "https://nagrik.party/transparency", "View Transparency Ledger")}
<p style="font-size:12px;color:#8a7f63;">Sawal ho to reply karein: <a href="mailto:donations@nagrik.party" style="color:#b3541e;">donations@nagrik.party</a></p>`),
  };
}

export function membershipReceivedEmail(opts: { name: string; dashboardUrl?: string }): { subject: string; html: string } {
  return {
    subject: "Nagrik Party: Membership Application Received",
    html: brandShell("Application Mil Gayi Hai",
      `<p>Namaste ${opts.name},</p>
<p>Aapki <strong>Founding Member</strong> application mil gayi hai. Verification team voter details check karegi. Aam taur par kuch din lagte hain.</p>
${ctaButton(opts.dashboardUrl || "https://nagrik.party/member", "Open Member Dashboard")}
<p style="font-size:12px;color:#8a7f63;">Membership card sirf approval ke baad issue hoti hai. Ye organizational record hai, sarkari document nahi.</p>`),
  };
}

export function membershipApprovedEmail(opts: { name: string; membershipId: string; cardUrl?: string }): { subject: string; html: string } {
  return {
    subject: `Nagrik Party: Welcome! Your Nagrik ID ${opts.membershipId}`,
    html: brandShell("Swagat Hai, Aap Founding Member Hain",
      `<p>Namaste ${opts.name},</p>
<p>Badhai ho! Aapki membership <strong>approve</strong> ho gayi hai. Aapka organizational Nagrik ID:</p>
<p style="font-family:monospace;font-size:20px;font-weight:700;letter-spacing:0.06em;color:#1d5635;background:#eef4ee;border:1px dashed #1d5635;border-radius:3px;padding:12px;text-align:center;">${opts.membershipId}</p>
${ctaButton(opts.cardUrl || "https://nagrik.party/member/membership-card", "View Membership Card")}`),
  };
}

export function membershipStatusEmail(opts: {
  name: string; status: "NEEDS_CORRECTION" | "REJECTED"; reason: string; actionUrl?: string;
}): { subject: string; html: string } {
  const isCorrection = opts.status === "NEEDS_CORRECTION";
  return {
    subject: isCorrection ? "Nagrik Party: Application me sudhaar chahiye" : "Nagrik Party: Application status update",
    html: brandShell(isCorrection ? "Ek Chhota Sudhaar Chahiye" : "Application Status Update",
      `<p>Namaste ${opts.name},</p>
<p>${isCorrection ? "Aapki application me ek chhoti jaankari adhoori hai:" : "Khed hai, aapki application is charan me aage nahi badh saki:"}</p>
<div style="background:#faf7ef;border:1px solid #e3dccb;border-radius:3px;padding:12px 16px;margin:16px 0;font-size:13.5px;">${opts.reason}</div>
${isCorrection ? ctaButton(opts.actionUrl || "https://nagrik.party/member/induction", "Sudhaar Karke Dobara Submit Karein") : `<p>Dobara apply karein: <a href="https://nagrik.party/membership" style="color:#b3541e;">nagrik.party/membership</a></p>`}`),
  };
}

export function volunteerWelcomeEmail(opts: { name: string; skills: string }): { subject: string; html: string } {
  return {
    subject: "Nagrik Party: Volunteer Welcome",
    html: brandShell("Welcome, Volunteer!",
      `<p>Namaste ${opts.name},</p>
<p>Volunteer banne ke liye dhanyavaad! Aapke skills <strong>${opts.skills}</strong> operations team ko bhej diye gaye hain. Ward coordinator jald sampark karega.</p>
${ctaButton("https://nagrik.party/explore", "Open Civic Explorer")}`),
  };
}

export function announcementEmail(opts: { title: string; bodyHtml: string; ctaUrl?: string; ctaLabel?: string }): {
  subject: string; html: string;
} {
  return {
    subject: `Nagrik Party: ${opts.title}`,
    html: brandShell(opts.title,
      `${opts.bodyHtml}${opts.ctaUrl ? ctaButton(opts.ctaUrl, opts.ctaLabel || "Aur Jaanein") : ""}`),
  };
}

export { EMAIL_LOGO_PNG };