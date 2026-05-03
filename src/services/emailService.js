const nodemailer = require("nodemailer");

// Configure email service (you can use Gmail, SendGrid, etc.)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASSWORD || ""
  }
});

/**
 * Send account deletion notification email
 * @param {string} email - Recipient email
 * @param {string} fullName - User's full name
 * @param {string} reason - Reason for account deletion
 * @param {string} adminName - Admin's name
 */
async function sendAccountDeletionEmail(email, fullName, reason, adminName) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .reason-box { background: white; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Deleted</h1>
            </div>
            <div class="content">
              <p>Dear ${fullName},</p>
              
              <div class="alert">
                <strong>Important Notice:</strong> Your account with WMT Mobile App has been deleted by an administrator.
              </div>

              <h3>Deletion Details:</h3>
              <div class="reason-box">
                <p><strong>Reason for Account Deletion:</strong></p>
                <p>${reason || 'No specific reason provided'}</p>
              </div>

              <p><strong>Administrator:</strong> ${adminName}</p>
              <p><strong>Deletion Date:</strong> ${new Date().toLocaleString()}</p>

              <h3>What This Means:</h3>
              <ul>
                <li>Your account and all associated data have been removed from our system</li>
                <li>You will no longer be able to login with your phone number</li>
                <li>Any pending appointments or transactions have been cancelled</li>
                <li>Historical records may be retained for compliance purposes</li>
              </ul>

              <h3>Need Help?</h3>
              <p>If you believe this is a mistake or have questions, please contact our support team at support@wmtapp.com</p>

              <div class="footer">
                <p>This is an automated message from WMT Mobile App. Please do not reply to this email.</p>
                <p>&copy; 2026 WMT Mobile App. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Account Deletion Notification - WMT Mobile App",
      html: htmlContent,
      text: `Dear ${fullName},\n\nYour account with WMT Mobile App has been deleted by an administrator.\n\nReason: ${reason || 'No specific reason provided'}\nAdministrator: ${adminName}\n\nIf you believe this is a mistake, contact support@wmtapp.com`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

/**
 * Send account locked email
 */
async function sendAccountLockedEmail(email, fullName, reason, adminName) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff9800; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Suspended</h1>
            </div>
            <div class="content">
              <p>Dear ${fullName},</p>
              <div class="alert">
                Your account has been suspended by an administrator.
              </div>
              <p><strong>Reason:</strong> ${reason}</p>
              <p>Contact support@wmtapp.com for more information.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Account Suspended - WMT Mobile App",
      html: htmlContent
    });
  } catch (error) {
    console.error("Failed to send account locked email:", error);
    throw error;
  }
}

/**
 * Send booking confirmation email to customer and owner
 */
async function sendBookingAddedEmail(customerEmail, customerName, ownerEmail, ownerName, bookingDetails) {
  try {
    const { garageName, service, appointmentDate, appointmentTime } = bookingDetails;
    
    // Customer Email
    const customerHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #4CAF50;">Booking Confirmed</h2>
            <p>Dear ${customerName},</p>
            <p>Your booking at <strong>${garageName}</strong> has been received successfully.</p>
            <ul>
              <li><strong>Service:</strong> ${service}</li>
              <li><strong>Date:</strong> ${appointmentDate}</li>
              <li><strong>Time:</strong> ${appointmentTime}</li>
            </ul>
            <p>Thank you for using WMT Mobile App.</p>
          </div>
        </body>
      </html>
    `;

    // Owner Email
    const ownerHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2196F3;">New Booking Received</h2>
            <p>Dear ${ownerName},</p>
            <p>You have received a new booking from <strong>${customerName}</strong>.</p>
            <ul>
              <li><strong>Service:</strong> ${service}</li>
              <li><strong>Date:</strong> ${appointmentDate}</li>
              <li><strong>Time:</strong> ${appointmentTime}</li>
            </ul>
          </div>
        </body>
      </html>
    `;

    const emailPromises = [];

    if (customerEmail && customerEmail.trim() !== "") {
      emailPromises.push(
        transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: customerEmail,
          subject: "Booking Confirmed - WMT Mobile App",
          html: customerHtml
        }).catch(err => console.error("Failed to send email to customer:", err))
      );
    }

    if (ownerEmail && ownerEmail.trim() !== "") {
      emailPromises.push(
        transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: ownerEmail,
          subject: "New Booking Received - WMT Mobile App",
          html: ownerHtml
        }).catch(err => console.error("Failed to send email to owner:", err))
      );
    }

    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
    }
  } catch (error) {
    console.error("Failed to send booking added emails:", error);
  }
}

/**
 * Send booking cancellation email to customer and owner
 */
async function sendBookingCancelledEmail(customerEmail, customerName, ownerEmail, ownerName, bookingDetails) {
  try {
    const { garageName, service, appointmentDate, appointmentTime } = bookingDetails;
    
    // Customer Email
    const customerHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #f44336;">Booking Cancelled</h2>
            <p>Dear ${customerName},</p>
            <p>Your booking at <strong>${garageName}</strong> has been cancelled.</p>
            <ul>
              <li><strong>Service:</strong> ${service}</li>
              <li><strong>Date:</strong> ${appointmentDate}</li>
              <li><strong>Time:</strong> ${appointmentTime}</li>
            </ul>
            <p>If you have any questions, please contact the garage or our support.</p>
          </div>
        </body>
      </html>
    `;

    // Owner Email
    const ownerHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #f44336;">Booking Cancelled</h2>
            <p>Dear ${ownerName},</p>
            <p>A booking from <strong>${customerName}</strong> has been cancelled.</p>
            <ul>
              <li><strong>Service:</strong> ${service}</li>
              <li><strong>Date:</strong> ${appointmentDate}</li>
              <li><strong>Time:</strong> ${appointmentTime}</li>
            </ul>
          </div>
        </body>
      </html>
    `;

    const emailPromises = [];

    if (customerEmail && customerEmail.trim() !== "") {
      emailPromises.push(
        transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: customerEmail,
          subject: "Booking Cancelled - WMT Mobile App",
          html: customerHtml
        }).catch(err => console.error("Failed to send cancellation to customer:", err))
      );
    }

    if (ownerEmail && ownerEmail.trim() !== "") {
      emailPromises.push(
        transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: ownerEmail,
          subject: "Booking Cancelled - WMT Mobile App",
          html: ownerHtml
        }).catch(err => console.error("Failed to send cancellation to owner:", err))
      );
    }

    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
    }
  } catch (error) {
    console.error("Failed to send booking cancelled emails:", error);
  }
}

/**
 * Send booking confirmation email to customer
 */
async function sendBookingConfirmedEmail(customerEmail, customerName, bookingDetails) {
  try {
    const { garageName, service, appointmentDate, appointmentTime } = bookingDetails;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body>
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #4CAF50;">Booking Confirmed!</h2>
            <p>Dear ${customerName},</p>
            <p>Your booking at <strong>${garageName}</strong> has been confirmed by the garage.</p>
            <ul>
              <li><strong>Service:</strong> ${service}</li>
              <li><strong>Date:</strong> ${appointmentDate}</li>
              <li><strong>Time:</strong> ${appointmentTime}</li>
            </ul>
            <p>We look forward to seeing you!</p>
          </div>
        </body>
      </html>
    `;

    if (customerEmail && customerEmail.trim() !== "") {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: customerEmail,
        subject: "Booking Confirmed! - WMT Mobile App",
        html: htmlContent
      });
    }
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
  }
}

/**
 * Send order confirmation email to customer
 */
async function sendOrderConfirmedEmail(customerEmail, customerName, orderDetails) {
  try {
    const { _id, id, totalAmount, items } = orderDetails;
    const orderIdStr = (id || _id || "").toString();
    
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.partName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">Rs ${item.unitPrice.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">Rs ${item.subtotal.toLocaleString()}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #4CAF50;">Order Confirmed!</h2>
              <p style="color: #666;">Order ID: #${orderIdStr.slice(-8).toUpperCase()}</p>
            </div>
            
            <p>Dear ${customerName},</p>
            <p>Great news! Your order has been confirmed by the supplier and is now being processed.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f8f8f8;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: left;">Qty</th>
                  <th style="padding: 10px; text-align: left;">Price</th>
                  <th style="padding: 10px; text-align: left;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total Amount:</td>
                  <td style="padding: 10px; font-weight: bold; color: #4CAF50;">Rs ${totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
            
            <p>You will receive another update once your order has been shipped.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
              <p>Thank you for choosing WMT Mobile App.</p>
              <p>&copy; 2026 WMT Mobile App</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (customerEmail && customerEmail.trim() !== "") {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: customerEmail,
        subject: `Order Confirmed: #${orderIdStr.slice(-8).toUpperCase()} - WMT Mobile App`,
        html: htmlContent
      });
      console.log(`Order confirmation email sent to ${customerEmail}`);
    }
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}

/**
 * Send order shipped email to customer
 */
async function sendOrderShippedEmail(customerEmail, customerName, orderDetails) {
  try {
    const { _id, id } = orderDetails;
    const orderIdStr = (id || _id || "").toString();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2196F3;">Your Order has Shipped!</h2>
              <p style="color: #666;">Order ID: #${orderIdStr.slice(-8).toUpperCase()}</p>
            </div>
            
            <p>Dear ${customerName},</p>
            <p>Exciting news! Your order has been picked up by our courier and is on its way to you.</p>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
              <p style="margin: 0;"><strong>Status:</strong> Shipped & In Transit</p>
              <p style="margin: 5px 0 0 0;"><strong>Estimated Delivery:</strong> 2-3 business days</p>
            </div>

            <p>You can track your order status directly in the WMT Mobile App.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
              <p>Thank you for choosing WMT Mobile App.</p>
              <p>&copy; 2026 WMT Mobile App</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (customerEmail && customerEmail.trim() !== "") {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: customerEmail,
        subject: `Your Order #${orderIdStr.slice(-8).toUpperCase()} has Shipped! - WMT Mobile App`,
        html: htmlContent
      });
      console.log(`Order shipped email sent to ${customerEmail}`);
    }
  } catch (error) {
    console.error("Failed to send order shipped email:", error);
  }
}

module.exports = {
  sendAccountDeletionEmail,
  sendAccountLockedEmail,
  sendBookingAddedEmail,
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
  sendOrderConfirmedEmail,
  sendOrderShippedEmail
};
