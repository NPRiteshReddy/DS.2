/**
 * Email Service using Resend API
 * Handles sending email notifications for reminders
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'notifications@student-learning.app';

/**
 * Send email using Resend API
 * @param {Object} params - Email parameters
 * @returns {Promise<Object>} Resend API response
 */
const sendEmail = async ({ to, subject, html, text }) => {
    if (!RESEND_API_KEY) {
        console.log('📧 Email not sent (RESEND_API_KEY not configured):', subject);
        return { success: false, reason: 'API key not configured' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: RESEND_FROM_EMAIL,
                to: [to],
                subject,
                html,
                text
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API error:', data);
            return { success: false, error: data };
        }

        console.log(`📧 Email sent to ${to}: ${subject}`);
        return { success: true, id: data.id };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send assignment reminder email
 * @param {Object} params - Reminder details
 */
const sendReminderEmail = async ({ to, assignmentTitle, courseName, dueDate, hoursUntilDue }) => {
    let timeMessage;
    if (hoursUntilDue <= 0) {
        timeMessage = 'is now overdue!';
    } else if (hoursUntilDue < 24) {
        timeMessage = `is due in ${hoursUntilDue} hour${hoursUntilDue === 1 ? '' : 's'}`;
    } else {
        const days = Math.round(hoursUntilDue / 24);
        timeMessage = `is due in ${days} day${days === 1 ? '' : 's'}`;
    }

    const formattedDueDate = new Date(dueDate).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
        .assignment-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .due-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
        .overdue-badge { background: #fee2e2; color: #991b1b; }
        .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">📚 Assignment Reminder</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Don't forget about your upcoming assignment!</p>
        </div>
        <div class="content">
          <div class="assignment-card">
            <h2 style="margin: 0 0 10px; color: #1f2937;">${assignmentTitle}</h2>
            ${courseName ? `<p style="color: #6b7280; margin: 0 0 15px;">Course: ${courseName}</p>` : ''}
            <span class="due-badge ${hoursUntilDue <= 0 ? 'overdue-badge' : ''}">${timeMessage}</span>
            <p style="color: #6b7280; margin: 15px 0 0;">
              <strong>Due:</strong> ${formattedDueDate}
            </p>
          </div>
          <p>Make sure to complete your assignment before the deadline. Good luck! 🎯</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/assignments" class="cta-button">
            View Assignment
          </a>
        </div>
        <div class="footer">
          <p>You're receiving this because you set a reminder on Student Learning Platform.</p>
          <p>© ${new Date().getFullYear()} Student Learning Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
Assignment Reminder: ${assignmentTitle}

${courseName ? `Course: ${courseName}\n` : ''}
Your assignment "${assignmentTitle}" ${timeMessage}.

Due: ${formattedDueDate}

View your assignment: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/assignments

- Student Learning Platform
  `;

    return sendEmail({
        to,
        subject: `📚 Reminder: ${assignmentTitle} ${timeMessage}`,
        html,
        text
    });
};

/**
 * Check if email service is configured
 * @returns {boolean}
 */
const isConfigured = () => {
    return !!RESEND_API_KEY;
};

module.exports = {
    sendEmail,
    sendReminderEmail,
    isConfigured
};
