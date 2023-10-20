import express from 'express';
import { auth } from 'express-openid-connect';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SESSION_SECRET!,
  baseURL: 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID!,
  issuerBaseURL: process.env.AUTH0_DOMAIN!
};

console.log(`Session secret is: ${process.env.SESSION_SECRET}`);

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
