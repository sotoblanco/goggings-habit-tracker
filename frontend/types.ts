
export enum TaskDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  SAVAGE = 'Savage',
}

// A task instance that is shown on a specific day. Can be a single task or an instance of a recurring one.
export interface Task {
  id: string;
  date: string;
  description: string;
  difficulty: TaskDifficulty;
  completed: boolean;
  category: string;
  story?: string;
  recurringMasterId?: string; // Links an instance to its master recurring task
  estimatedTime: number; // in minutes
  actualTime: number | null; // in minutes
  goalAlignment?: number; // Score from 1-5
  alignedGoalId?: string; // ID of the goal it's most aligned with
  justification?: string; // Justification for the goal alignment
  time?: string; // Optional: HH:mm format
  betAmount?: number;
  betMultiplier?: number;
  betPlaced?: boolean;
  betWon?: boolean;
}

// A flattened task instance used for the "All Tasks" view.
export interface TaskInstance extends Task { }

export type RecurrenceRule = 'Daily' | 'Weekly' | 'Weekdays' | 'Weekends';

// The definition of a recurring task
export interface RecurringTask {
  id: string;
  description: string;
  difficulty: TaskDifficulty;
  category: string;
  story?: string;
  recurrenceRule: RecurrenceRule;
  startDate: string;
  estimatedTime: number; // in minutes
  completions: { [date: string]: { completed: boolean; actualTime: number | null; time?: string; betAmount?: number; betMultiplier?: number; betPlaced?: boolean; betWon?: boolean; } }; // key is YYYY-MM-DD date string
  goalAlignment?: number; // Score from 1-5
  alignedGoalId?: string; // ID of the goal it's most aligned with
  justification?: string; // Justification for the goal alignment
  time?: string; // Optional: HH:mm format for the master task
}


export interface DailyScore {
  date: string;
  earnings: number;
  tasksCompleted: number;
  grade?: string;
}

export interface CategoryScore {
  category: string;
  earnings: number;
  tasksCompleted: number;
}

export interface ObjectiveScore {
  goalId: string;
  goalDescription: string;
  goalLabel?: string;
  earnings: number;
  tasksCompleted: number;
}

export interface SideQuest {
  id: string;
  description: string;
  difficulty: TaskDifficulty;
  dailyGoal: number; // How many times it can be done per day. 0 for infinite.
  completions: { [date: string]: number }; // Key is YYYY-MM-DD, value is count for that day
}

export interface Character {
  spent?: number;
  bonuses?: number;
}

export interface User {
  id: string;
  username: string;
  api_key?: string;
}

export interface DiaryEntry {
  date: string; // YYYY-MM-DD
  initialReflection?: string;
  initialFeedback?: string;
  debrief?: string;
  finalFeedback?: string;
  grade?: string;
}

export interface ReviewSuggestions {
  keep: string[];
  remove: string[];
  add: string[];
}

export interface ReviewResult {
  good: string[];
  bad: string[];
  suggestions: ReviewSuggestions;
}

export interface GoalKPI {
  description: string;
  type: 'Internal Metric' | 'External Metric';
  target: string;
}

export interface GoalContract {
  primaryObjective: string;
  contractStatement: string;
  rewardPayout: number;
  kpis: GoalKPI[];
  preStateAnswers: { question: string; answer: string }[];
  fiveWhys: string[];
}

export interface Goal {
  id: string;
  description: string;
  targetDate: string; // YYYY-MM-DD
  label?: string; // AI-generated short label
  system?: AtomicHabitsSuggestions;
  completed?: boolean;
  completionDate?: string; // YYYY-MM-DD
  completionProof?: string;
  completionFeedback?: string;
  contract?: GoalContract;
}

export interface AtomicHabitsSuggestions {
  obvious: string[];
  attractive: string[];
  easy: string[];
  satisfying: string[];
}

export interface WeeklyGoalEvaluation {
  alignmentScore: number;
  feedback: string;
}

export interface WeeklyGoal {
  id: string; // A unique identifier for the goal
  description: string;
  targetDate: string;
  evaluation?: WeeklyGoalEvaluation;
  alignedGoalId?: string; // ID of the long-term goal it's most aligned with
  goalAlignment?: number; // Score from 1-5
  label?: string; // AI-generated short label
  contract?: GoalContract;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
}

export interface Wish {
  id: string;
  description: string;
  link?: string;
  explanation: string;
  label?: string;
  contract?: GoalContract;
}

export interface CoreTask {
  id: string;
  description: string;
  link?: string;
  explanation: string;
  label?: string;
  contract?: GoalContract;
}

export interface PurchasedReward {
  id: string;
  rewardId: string;
  name: string;
  cost: number;
  purchaseDate: string; // YYYY-MM-DD
}

export interface AppContext {
  currentDate: string;
  tasks: { [key: string]: Task[] };
  recurringTasks: RecurringTask[];
  sideQuests: SideQuest[];
  diaryEntries: { [key: string]: DiaryEntry };
  goals: Goal[];
  weeklyGoals: { [key: string]: WeeklyGoal[] };
  rewards: Reward[];
  purchasedRewards: PurchasedReward[];
  character: Character;
  dailyScores: DailyScore[];
  categoryScores: CategoryScore[];
  objectiveScores: ObjectiveScore[];
  streak: number;
  dailyGoal: number;
  userCategories: string[];
  wishList: Wish[];
  coreList: CoreTask[];
}
