const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const qs = require('qs');

const {
  MERCHANT_ID,
  HASH_KEY,
  HASH_IV,
  RETURN_URL,
  NOTIFY_URL
} = process.env;

function createData(order) {
  return {
    MerchantID: MERCHANT_ID,
    RespondType: 'JSON',
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
    Version: '2.0',
    LangType: 'zh-tw',
    MerchantOrderNo: order.orderNo,
    Amt: order.amount,
    ItemDesc: order.description,
    ReturnURL,
    NotifyURL,
    Email: order.email
  };
}

function encryptTradeInfo(data) {
  const tradeInfo = qs.stringify(data);
  const cipher = crypto.createCipheriv('aes-256-cbc', HASH_KEY, HASH_IV);
  let encrypted = cipher.update(tradeInfo, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function getTradeSha(encrypted) {
  const plainText = `HashKey=${HASH_KEY}&${encrypted}&HashIV=${HASH_IV}`;
  return crypto.createHash('sha256').update(plainText).digest('hex').toUpperCase();
}

router.post('/pay', (req, res) => {
  const order = req.body;
  const data = createData(order);
  const TradeInfo = encryptTradeInfo(data);
  const TradeSha = getTradeSha(TradeInfo);

  res.json({
    MerchantID: MERCHANT_ID,
    TradeInfo,
    TradeSha,
    Version: '2.0',
    PayURL: 'https://ccore.newebpay.com/MPG/mpg_gateway'
  });
});

router.post('/notify', express.urlencoded({ extended: false }), (req, res) => {
  const { TradeInfo } = req.body;
  const decipher = crypto.createDecipheriv('aes-256-cbc', HASH_KEY, HASH_IV);
  decipher.setAutoPadding(false);

  let decrypted = decipher.update(TradeInfo, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  const cleaned = decrypted.replace(/[ - ]+/g, '');

  const info = JSON.parse(cleaned);
  console.log('付款通知結果:', info);

  res.status(200).end();
});

module.exports = router;
