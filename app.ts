import express from 'express';
import { auth, AuthConfig, requiresAuth } from 'express-openid-connect';
import dotenv from 'dotenv';

dotenv.config();

const config: AuthConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SESSION_SECRET!,
  baseURL: 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID!,
  issuerBaseURL: process.env.AUTH0_DOMAIN!
};

const app = express();

// Use auth middleware
app.use(auth(config));

app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// Your other routes here

// Start the server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
