import express from 'express';
import cors from 'cors';
import { auth } from 'express-openid-connect';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const environment = process.env.ENVIRONMENT!;
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
// if environment = production then port = 3000
const port = environment === 'production'? 443 : 3000;

// const config = {
//   authRequired: false,
//   auth0Logout: true,
//   secret: process.env.SESSION_SECRET!,
//   baseURL: 'http://localhost:3000',
//   clientID: process.env.AUTH0_CLIENT_ID!,
//   issuerBaseURL: process.env.AUTH0_DOMAIN!
// };

console.log(`Session secret is: ${process.env.SESSION_SECRET}`);

const app = express();
app.use(express.json());

// Use auth middleware
// app.use(auth(config));

app.use(cors({
  origin: 'http://localhost:5173' 
}));

app.use(express.json());

// app.get('/', (req, res) => {
//   res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
// });

interface User {
  given_name: string;
  family_name: string; 
  nickname: string;
  name: string;
  picture: string;
  locale: string;
  updated_at: string;
  email: string; 
  email_verified: boolean;
  sub: string;
}

// app.post('/user/create', async (req, res) => {

//   console.log("USER CREATE 2");
//   console.log(req.body);

//   res.send('User created');

// });

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
  isFavourite: boolean;
  rewardDate: Date;
  stepGoal: string;
  progress: number;
  rewardEnergy: number;
  rewardGrowth: number;
  stepValues: string[];
  isActive: boolean;
}



interface GoalDbRepresentation {
  name: string;
  userId: string;
  frequency: string;
  isFavourite: boolean;
  rewardDate: Date;
  stepGoal: string;
  progress: number;
  rewardEnergy: number;
  rewardGrowth: number;
  stepValues: string;
  isActive: boolean;
}

interface User {
  given_name: string;
  family_name: string;
  nickname: string;
  name: string;
  picture: string;
  locale: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
  sub: string;
}


app.post('/create/user', async (req, res) => {
  const user: User = req.body;

  console.log("User: " + JSON.stringify(user));

  const { data, error } = await supabase
    .from('user')
    .insert({ "id": user.email, "createDate": user.updated_at, "name": user.name, "rewardEnergy": 0, "rewardGrowth": 0 });

  if (error) {
    console.log("Error: " + JSON.stringify(error));

  }

  res.send(error || data);
});


app.post('/create/goal', async (req, res) => {

  console.log(JSON.stringify(req.body));

  const { name, userId, rewardDate, frequency, isFavourite, stepGoal, stepValues } = req.body;
  const initialGoal: Goal = createInitialGoal(name, userId, rewardDate, frequency, isFavourite, stepGoal, stepValues);

  const intialGoalDbRepresentation = convertFromGoalToDbRepresentation(initialGoal);

  console.log("Initial Goal: " + JSON.stringify(initialGoal));

  console.log("Initial GoalDbRepresentation: " + JSON.stringify(intialGoalDbRepresentation));

  const { data, error } = await supabase
    .from('goal')

    .insert([intialGoalDbRepresentation]);

  res.send(error || data);
  if (error) {
    console.log("Goal store error: " + JSON.stringify(error));
  }
});

const convertFromGoalToDbRepresentation = (goal: Goal): GoalDbRepresentation => {

  const goalDbRepresentation: GoalDbRepresentation = {
    name: goal.name,
    userId: goal.userId,
    frequency: goal.frequency.toString(),
    isFavourite: goal.isFavourite,
    rewardDate: goal.rewardDate,
    stepGoal: goal.stepGoal,
    progress: goal.progress,
    rewardEnergy: goal.rewardEnergy,
    rewardGrowth: goal.rewardGrowth,
    stepValues: goal.stepValues.toString(),
    isActive: goal.isActive
  };

  return goalDbRepresentation;
};

// add get request to get all goals for user
app.get('/get/goals/:userId', async (req, res) => {
  const userId = req.params['userId'];

  const { data, error } = await supabase
    .from('goal')
    .select('*')
    .eq('userId', userId);
  

  res.send(error || data);
});


// Adding new achivement for the goal (step)
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
const createInitialGoal = (name: string, userId: string, rewardDate: Date, frequency: any, isFavourite: boolean, stepGoal: string, stepValues: string[]): Goal => {

  const initialGoal: Goal = {
    name,
    userId,
    frequency,
    isFavourite,
    rewardDate,
    stepGoal,
    progress: 0,
    rewardEnergy: 1,
    rewardGrowth: 1,
    stepValues,
    isActive: true
  };

  return initialGoal;
};

const recalculateGoalAfterAchievement = async (goalName: string): Promise<Goal> => {


  const { data, error } = await supabase
    .from('goal')
    .select('*')
    .eq('name', goalName);

  if (error) {
    console.log(error);
  }

  const goal: Goal = data![0];

  goal.progress += 1;
  goal.rewardEnergy += 1;
  goal.rewardGrowth += 1;

  return goal;

};


// Start the server
app.listen(port, () => {
  console.log('Server started on http://localhost:' + port);
});
