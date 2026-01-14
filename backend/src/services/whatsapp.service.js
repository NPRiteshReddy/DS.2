/**
 * WhatsApp Service using WhatsApp Business API
 * Handles sending WhatsApp notifications for reminders
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Send WhatsApp message using WhatsApp Business API
 * @param {Object} params - Message parameters
 * @returns {Promise<Object>} API response
 */
const sendMessage = async ({ to, message }) => {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
        console.log('📱 WhatsApp not sent (API not configured):', message.substring(0, 50));
        return { success: false, reason: 'API not configured' };
    }

    // Format phone number (remove any non-digits, ensure country code)
    const formattedPhone = formatPhoneNumber(to);

    try {
        const response = await fetch(
            `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: formattedPhone,
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: message
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp API error:', data);
            return { success: false, error: data };
        }

        console.log(`📱 WhatsApp sent to ${formattedPhone}`);
        return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
        console.error('WhatsApp send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send assignment reminder via WhatsApp
 * @param {Object} params - Reminder details
 */
const sendReminderWhatsApp = async ({ to, assignmentTitle, courseName, dueDate, hoursUntilDue }) => {
    let timeMessage;
    if (hoursUntilDue <= 0) {
        timeMessage = '⚠️ is now OVERDUE!';
    } else if (hoursUntilDue < 24) {
        timeMessage = `⏰ is due in ${hoursUntilDue} hour${hoursUntilDue === 1 ? '' : 's'}`;
    } else {
        const days = Math.round(hoursUntilDue / 24);
        timeMessage = `📅 is due in ${days} day${days === 1 ? '' : 's'}`;
    }

    const formattedDueDate = new Date(dueDate).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const message = `📚 *Assignment Reminder*

*${assignmentTitle}*${courseName ? `\n📖 Course: ${courseName}` : ''}

${timeMessage}

📆 Due: ${formattedDueDate}

Don't forget to complete your assignment! 🎯

_Student Learning Platform_`;

    return sendMessage({ to, message });
};

/**
 * Send a template message (for message templates registered with WhatsApp)
 * @param {Object} params - Template parameters
 */
const sendTemplateMessage = async ({ to, templateName, templateParams }) => {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
        return { success: false, reason: 'API not configured' };
    }

    const formattedPhone = formatPhoneNumber(to);

    try {
        const response = await fetch(
            `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: formattedPhone,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: 'en' },
                        components: templateParams ? [
                            {
                                type: 'body',
                                parameters: templateParams.map(p => ({
                                    type: 'text',
                                    text: p
                                }))
                            }
                        ] : []
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp template error:', data);
            return { success: false, error: data };
        }

        return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
        console.error('WhatsApp template send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Format phone number for WhatsApp API
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, assume it needs country code (default to India +91)
    if (cleaned.startsWith('0')) {
        cleaned = '91' + cleaned.substring(1);
    }

    // If doesn't have country code (less than 12 digits for India), add default
    if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }

    return cleaned;
};

/**
 * Check if WhatsApp service is configured
 * @returns {boolean}
 */
const isConfigured = () => {
    return !!(WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN);
};

module.exports = {
    sendMessage,
    sendReminderWhatsApp,
    sendTemplateMessage,
    isConfigured
};
