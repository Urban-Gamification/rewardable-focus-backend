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
const port = environment === 'production' ? 80 : 3000;

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


interface Goal {
  name: string;
  userId: string;
  frequency: {
    type:
    | "hourly"
    | "every_2_hours"
    | "every_4_hours"
    | "daily"
    | "every_2_days"
    | "weekly"
    | "monthly";
  };
  isFavourite: boolean,
  rewardDate: Date,
  stepGoal: string;
  progress: number;
  reward_energy: number;
  reward_growth: number;
}


// Добавление новой цели для пользователя
app.post('/create/goal', async (req, res) => {
  const { name, userId, rewardDate, frequency, isFavorite, stepGoal, stepValues } = req.body;

  const initialGoal: Goal = createInitialGoal(name, userId, rewardDate, frequency, isFavorite, stepGoal);

  const { data, error } = await supabase
    .from('goal')
    .insert([initialGoal]);

  res.send(error || data);
});

// add get request to get all goals for user
app.get('/get/goals', async (req, res) => {
  const { userId } = req.body;
  const { data, error } = await supabase
    .from('goal')
    .select('*')
    .eq('userId', userId);
  res.send(error || data);
});


// Добавление достижения
app.post('/add/step', async (req, res) => {
  const { goalName, timestamp, value } = req.body;

  const step_update_result = await supabase
    .from('step')
    .insert([{ goalName, timestamp, value }]);

  if (step_update_result.error) {

    console.log("Error while updating step: " + step_update_result.error);
  }

  var updatedGoal = await recalculateGoalAfterAchievement(goalName);
  const { data, error } = await supabase
    .from('goal')
    .update(updatedGoal)
    .eq('name', goalName);
    

  res.send(error || data);
});


// implement createInitialGoal function
const createInitialGoal = (name: string, userId: string, rewardDate: Date, frequency: any, isFavourite: boolean, stepGoal: string): Goal => {

  const initialGoal: Goal = {
    name,
    userId,
    frequency,
    isFavourite,
    rewardDate,
    stepGoal,
    progress: 0,
    reward_energy: 1,
    reward_growth: 1,
  };

  return initialGoal;
};

const recalculateGoalAfterAchievement = async (goalName: string): Promise<Goal> => {
// request supabase for the goal using the goalName
  const { data, error } = await supabase
    .from('goal')
    .select('*')
    .eq('name', goalName);

  if (error) {
    console.log(error);
  }

  const goal: Goal = data![0];

  goal.progress += 1;
  goal.reward_energy += 1;
  goal.reward_growth += 1; 

  return goal;

};


// Start the server
app.listen(port, () => {
  console.log('Server started on http://localhost:' + port);
});
