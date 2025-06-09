import nodemailer from "nodemailer";

export default async function sendNotificationEmail(
  content: string,
  subject: string
) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // or your email provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "stephchikamhi@gmail.com",
      subject,
      text: content,
    });
  } catch (error) {
    console.error("Failed to send notification email:", error);
    throw error;
  }
}
