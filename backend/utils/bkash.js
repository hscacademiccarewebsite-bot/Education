const axios = require('axios');

const getBkashToken = async () => {
  try {
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

  } catch (error) {
    console.error("Error getting token:", error.message);
  }
};

const createBkashPayment = async ({ amount, payerReference, merchantInvoiceNumber }) => {
  try {
    const token = await getBkashToken();
    const response = await axios.post(
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create',
      {
        mode: '0011',
        payerReference: payerReference.toString(),
        callbackURL: `${process.env.FRONTEND_URL}/payments/bkash-callback?paymentId=${payerReference}`,
        amount: Number(amount).toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: merchantInvoiceNumber.toString()
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
    console.error("Error creating payment:", error.message);
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
