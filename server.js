const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const bodyParser = require('body-parser');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const {
  RESEND_API_KEY,
  FROM_EMAIL,
  URL,
  SERVER_PORT
} = process.env;

const resend = new Resend(RESEND_API_KEY);

app.post('/api/initiate-claim', async (req, res) => {
  try {
    const { giftAddress, email } = req.body;
    
    if (!giftAddress || !email) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const verificationToken = ethers.randomBytes(32);
    const verificationTokenHex = ethers.hexlify(verificationToken);

    const verificationUrl = `${URL}/giftbox/verifyclaim/${giftAddress}?token=${verificationTokenHex}`;
    
    // Send verification email using Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify Your Gift Claim',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 20px;">Verify Your Gift Claim</h1>
          <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">Click the button below to claim your gift:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Claim Your Gift</a>
          </div>
          <p style="font-size: 14px; color: #666;">This link will expire in 24 hours.</p>
          <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
    
    if (error) {
      console.error('Error sending email with Resend:', error);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }
    
    return res.json({ 
      success: true, 
      message: 'Verification email sent',
      emailId: data.id,
      verificationTokenHex: verificationTokenHex
    });
  } catch (error) {
    console.error('Error initiating claim:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});