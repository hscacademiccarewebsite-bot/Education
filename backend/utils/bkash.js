const axios = require('axios');

const BKASH_BASE_URL = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized';
const BKASH_APP_KEY = process.env.BKASH_APP_KEY;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET;
const BKASH_USERNAME = process.env.BKASH_USERNAME;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD;

async function getBkashToken() {
  try {
    const { data } = await axios.post(`${BKASH_BASE_URL}/checkout/token/grant`, {
      app_key: BKASH_APP_KEY,
      app_secret: BKASH_APP_SECRET
    }, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        username: BKASH_USERNAME,
        password: BKASH_PASSWORD
      }
    });
    return data.id_token;
  } catch (error) {
    console.error('Bkash get token error:', error?.response?.data || error.message);
    throw new Error('Failed to communicate with bKash API');
  }
}

async function createBkashPayment(paymentRecord, idToken) {
  try {
    const amountStr = Number(paymentRecord.amount).toFixed(2);
    
    const { data } = await axios.post(`${BKASH_BASE_URL}/checkout/create`, {
      // Tokenized checkout requires mode "0001" per bKash docs.
      mode: '0001',
      payerReference: paymentRecord.student.toString(),
      callbackURL: `${process.env.FRONTEND_URL}/payments/bkash-callback`,
      amount: amountStr,
      currency: paymentRecord.currency || 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: paymentRecord._id.toString()
    }, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authorization: idToken,
        'x-app-key': BKASH_APP_KEY
      }
    });

    return data;
  } catch (error) {
    console.error('Bkash create payment error:', error?.response?.data || error.message);
    throw new Error('Failed to create bKash payment');
  }
}

async function executeBkashPayment(paymentID, idToken) {
  try {
    const { data } = await axios.post(`${BKASH_BASE_URL}/checkout/execute`, {
      paymentID
    }, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authorization: idToken,
        'x-app-key': BKASH_APP_KEY
      }
    });

    return data;
  } catch (error) {
    console.error('Bkash execute err:', error?.response?.data || error.message);
    throw new Error('Failed to execute bKash payment');
  }
}

module.exports = { getBkashToken, createBkashPayment, executeBkashPayment };
