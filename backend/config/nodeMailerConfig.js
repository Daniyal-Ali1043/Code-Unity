const nodemailer = require('nodemailer');
const path = require('path'); // For file paths

exports.sendEmail = async (to, subject, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  tls: {
    rejectUnauthorized: false, // <-- This skips SSL verification
  },
  });

  // Define paths for assets
  const vectorLogoPath = path.join(__dirname, '../../src/assets/vector.png');
  const emailVerifyImagePath = path.join(__dirname, '../../src/assets/emailverify.png');

  // Email HTML Template
  const htmlContent = `
    <div style="background-color: #7b40d6; padding: 20px; text-align: center; font-family: Arial, sans-serif; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 20px; color: #333333;">
        <!-- Logo and CodeUnity Text -->
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; vertical-align: middle;">
            <img src="cid:logoImage" alt="CodeUnity Logo" style="width: 40px;"/>
          </div>
          <div style="display: inline-block; vertical-align: middle; font-size: 1.4rem; font-weight: bold; color: #7b40d6; margin-left: 10px;">
            CodeUnity.
          </div>
        </div>

        <!-- Image -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:emailImage" alt="OTP Verification" style="width: 50px;"/>
        </div>

        <!-- Heading -->
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 10px;">Here is your One Time Password</h2>
        <p style="color: #666666; margin: 0 0 20px;">to validate your email address</p>

        <!-- OTP -->
        <div style="font-size: 2rem; font-weight: bold; color: #7b40d6; margin-bottom: 10px;">
          ${otp}
        </div>
        <p style="color: #e74c3c; font-size: 0.9rem;">Valid for 10 minutes only</p>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px; font-size: 0.8rem; color: #999999;">
          <p>FAQs | Terms & Conditions | Contact Us</p>
        </div>
      </div>
    </div>
  `;

  // Send email
  await transporter.sendMail({
    from: `"CodeUnity" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
    attachments: [
      {
        filename: 'vector.png',
        path: vectorLogoPath,
        cid: 'logoImage', // Content ID for embedding the logo
      },
      {
        filename: 'emailverify.png',
        path: emailVerifyImagePath,
        cid: 'emailImage', // Content ID for embedding the illustration
      },
    ],
  });
};
