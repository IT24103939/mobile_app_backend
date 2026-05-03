require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("Configuring transporter...");
  console.log("USER:", process.env.EMAIL_USER);
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    console.log("Sending email...");
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self
      subject: "Test Email from WMT App",
      text: "This is a test email to verify credentials.",
    });
    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

testEmail();
