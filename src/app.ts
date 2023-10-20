import express from 'express';
import { auth } from 'express-openid-connect';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const environment = process.env.ENVIRONMENT!;
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
// if environment = production then port = 3000
const port = environment === 'production'? 80 : 3000;

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

// Добавление новой цели для пользователя
app.post('/add-goal', async (req, res) => {
  const { user_id, description, status } = req.body;
  const { data, error } = await supabase
    .from('Goals')
    .insert([{ user_id, description, status }]);
  res.send(error || data);
});

// Изменение статуса цели
app.put('/update-goal/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { data, error } = await supabase
    .from('Goals')
    .update({ status })
    .eq('id', id);
  res.send(error || data);
});

// Добавление достижения
app.post('/add-achievement', async (req, res) => {
  const { user_id, goal_id, description, timestamp } = req.body;
  const { data, error } = await supabase
    .from('Achievements')
    .insert([{ user_id, goal_id, description, timestamp }]);
  res.send(error || data);
});



// Start the server
app.listen(port, () => {
  console.log('Server started on http://localhost:' + port);
});
