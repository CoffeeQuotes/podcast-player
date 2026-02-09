const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const CryptoJS = require('crypto-js');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const authKey = process.env.AUTH_KEY;
const secretKey = process.env.SECRET_KEY;

dotenv.config();
app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000);