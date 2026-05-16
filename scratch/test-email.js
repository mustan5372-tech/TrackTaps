import { sendPremiumWelcomeEmail } from '../api/services/emailService.js';

// Mock data for test
const testEmail = 'tracktaps@gmail.com';
const testName = 'Mustansir Sanawadwala';
const testSubscription = {
  planType: 'yearly',
  expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  amountPaid: 499
};

console.log('🧪 Starting Email Test...');
console.log(`📧 Recipient: ${testEmail}`);

// Inject environment variables manually for the test
process.env.RESEND_API_KEY = 're_QGwPe2gk_HrL3yE49ioMxuMbaEytrHpYA';

async function runTest() {
  try {
    const result = await sendPremiumWelcomeEmail(testEmail, testName, testSubscription);
    if (result.success) {
      console.log('✅ Test Email Sent Successfully!');
      console.log('ID:', result.id);
    } else {
      console.error('❌ Test Email Failed:', result.error);
    }
  } catch (err) {
    console.error('💥 Critical Error during test:', err);
  }
}

runTest();
