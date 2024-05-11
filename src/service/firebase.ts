import * as admin from 'firebase-admin';

import env from '@env';

const config = {
  type: env.FIREBASE_TYPE,
  project_id: env.FIREBASE_PROJECT_ID,
  private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
  private_key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: env.FIREBASE_CLIENT_EMAIL,
  client_id: env.FIREBASE_CLIENT_ID,
  auth_uri: env.FIREBASE_AUTH_URI,
  token_uri: env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: env.FIREBASE_CLIENT_X509_CERT_URL,
} as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(config),
  storageBucket: env.FIREBASE_PROJECT_ID + '.appspot.com',
});

export default admin;
