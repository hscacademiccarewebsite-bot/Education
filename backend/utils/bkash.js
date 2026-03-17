const axios = require('axios');

const getBkashToken = async () => {
  const response = await axios.post(
    'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant',
    {
      app_key: process.env.BKASH_APP_KEY,
      app_secret: process.env.BKASH_APP_SECRET
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'username': process.env.BKASH_USERNAME,
        'password': process.env.BKASH_PASSWORD
      }
    }
  );
  return response.data.id_token;
};

const createBkashPayment = async ({ amount, payerReference, merchantInvoiceNumber }) => {
  try {
    console.log(`[bKash Create] Requesting token for payment: ${payerReference}`);
    const token = await getBkashToken();
    
    const payload = {
      mode: '0011',
      payerReference: payerReference.toString(),
      callbackURL: `${process.env.FRONTEND_URL}/payments/bkash-callback?paymentId=${payerReference}`,
      amount: Number(amount).toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: merchantInvoiceNumber.toString()
    };
    
    console.log(`[bKash Create] Sending request to bKash:`, payload);

    const response = await axios.post(
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'authorization': token,
          'x-app-key': process.env.BKASH_APP_KEY
        }
      }
    );

    console.log(`[bKash Create] Received response:`, response.data);
    return response.data;
  } catch (error) {
    console.error("[bKash Create] Error:", error.message);
    if (error.response) {
      console.error("[bKash Create] API Error Data:", error.response.data);
    }
    throw error;
  }
};

const executeBkashPayment = async (paymentID) => {
  try {
    const token = await getBkashToken();
    const response = await axios.post(
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/execute',
      {
        paymentID
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'authorization': token,
          'x-app-key': process.env.BKASH_APP_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error executing payment:", error.message);
    throw error;
  }
};

module.exports = {
  getBkashToken,
  createBkashPayment,
  executeBkashPayment
};
