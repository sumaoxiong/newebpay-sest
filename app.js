require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const newebpayRoutes = require('./routes/newebpay');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/newebpay', newebpayRoutes);
app.use('/views', express.static(path.join(__dirname, 'views')));

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
