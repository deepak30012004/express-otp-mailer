const express = require('express');
const app = express();
const port = 3000;
const dotenv=require('dotenv');
dotenv.config(); // ✅ Load environment variables from .env file

const nodemailer = require('nodemailer');
app.use(express.json()); // ✅ Add this to parse JSON body

// ✅ Fix typo: "createrTrasport" ➝ "createTransport"
const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'preocess.env.EMAIL ',
    pass: 'process.env.EMAIL_PASS', // ⚠️ Use App Password
  },
});

// ✅ Fix bug in OTP generation (infinite loop issue)
function generate_otp() {
  let len = 4;
  let s = '';
  for (let i = 0; i < len; i++) {
    s += Math.floor(Math.random() * 10);
  }
  return s; // ✅ Return OTP string, not `len`
}

// In-memory OTP store
const x = {};

// ✅ OTP Generation Route
app.post('/gen', async (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = generate_otp();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  x[email] = { otp, expiry };

  try {
    await transport.sendMail({
      from: 'deepaksingh30012004@gmail.com',
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });
    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ✅ OTP Verification Route
app.post('/verify', (req, res) => {
  const { email, otp } = req.body;
  const userOtp = x[email];

  if (!userOtp) {
    return res.status(404).json({ message: 'OTP not found for this email' });
  }

  if (Date.now() > userOtp.expiry) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  if (otp !== userOtp.otp) {
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  // ✅ OTP verified, remove it
  delete x[email];
  return res.status(200).json({ message: 'OTP verified successfully' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
