const express = require('express');
const app = express();
const port = 3001;
require('dotenv').config();

// gRPC imports
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const path = require('path');

//ACTUAL ROUTES
//localhost:3001/getinfo
app.get('/getinfo', function (req, res) {
  client.getInfo({}, function (err, response) {
    if (err) {
      console.error('Error fetching info:', err);
      return res
        .status(500)
        .json({ error: 'Failed to fetch info', details: err.message });
    }
    res.json(response);
  });
});

//localhost:3001/generate-invoice/01/200 (Shows payment_request & r_hash)
app.get('/generate-invoice/:source/:price', function (req, res) {
  let request = {
    value: req.params['price'],
    memo: req.params['source'],
  };
  client.addInvoice(request, function (err, response) {
    if (err) {
      console.error('Error generating invoice:', err.message);
      return res
        .status(500)
        .json({ error: 'Failed to generate invoice', details: err.message });
    }

    // Log the metadata to find the paymentHash
    //r_hash represents paymentHash
    // console.log('Generated Invoice Metadata:', response);
    res.json(response);
  });
});

//localhost:3001/check-invoice/:payment hash (Generated from console logging the metadate after generating invoice)
app.get('/check-invoice/:payment_hash', function (req, res) {
  const paymentHash = req.params['payment_hash'];

  // Validate the payment_hash length and format
  if (!/^[a-fA-F0-9]{64}$/.test(paymentHash)) {
    console.error('Invalid payment hash received:', paymentHash);
    return res.status(400).json({
      error: 'Completely invalid payment hash',
      details: 'Payment hash must be a 64-character hexadecimal string',
    });
  }

  let request = {
    r_hash_str: paymentHash,
  };
  client.lookupInvoice(request, function (err, response) {
    if (err) {
      console.error('Error checking invoice:', err.message);
      return res
        .status(500)
        .json({ error: 'Failed to check invoice again', details: err.message });
    }
    res.json(response);
    // console.log('Invoice lookup response:', response);
  });
});

//Serves files to user
app.get('/file/:source', function (req, res) {
  // var options = {
  //   root: path.join(__dirname, 'static'),
  //   dotfiles: 'deny',
  //   headers: {
  //     'x-timestamp': Date.now(),
  //     'x-sent': true,
  //   },
  // };

  const fileName = req.params['source'];
  const filePath = path.join(__dirname, 'static', fileName);

  // Set content type for image
  res.setHeader('Content-Type', 'image/jpeg');

  res.sendFile(filePath, function (err) {
    if (err) {
      console.error('Error sending file:', err.message);
      next(err); // Pass the error to Express' error handler
    } else {
      console.log('File sent:', fileName);
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';

const loaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

const packageDefinition = protoLoader.loadSync(
  'lightning.proto',
  loaderOptions
);

// Load lnd macaroon
let m = fs.readFileSync(process.env.MACAROON_PATH);
let macaroon = m.toString('hex');

// Build meta data credentials
let metadata = new grpc.Metadata();
metadata.add('macaroon', macaroon);
let macaroonCreds = grpc.credentials.createFromMetadataGenerator(
  (_args, callback) => {
    callback(null, metadata);
  }
);

// Combine credentials
let lndCert = fs.readFileSync(process.env.TLS_CERT_PATH);
let sslCreds = grpc.credentials.createSsl(lndCert);
let credentials = grpc.credentials.combineChannelCredentials(
  sslCreds,
  macaroonCreds
);

// Create client
let lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
let lnrpc = lnrpcDescriptor.lnrpc;
let client = new lnrpc.Lightning(process.env.HOST_PORT, credentials);
