import {
  Task, TaskDifficulty, ReviewResult, Goal, AtomicHabitsSuggestions,
  SideQuest, WeeklyGoal, WeeklyGoalEvaluation, PurchasedReward, AppContext,
  Character, Reward, Wish, CoreTask, GoalContract
} from '../types';
import { api } from './api';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the model with the API key from environment variables
const genAI = new GoogleGenerativeAI((import.meta as any).env.VITE_GEMINI_API_KEY || '');

// Removed manual initialization as we use the env var now
export const initializeGemini = (key: string) => {
  console.warn("initializeGemini is deprecated. Using VITE_GEMINI_API_KEY from environment.");
};

export const generateGogginsStory = async (
  task: { description: string, difficulty: TaskDifficulty, category: string, estimatedTime: number },
  goals: Goal[],
  justification?: string
): Promise<string> => {
  try {
    const response = await api.ai.story({ task, goals, justification });
    return response.story;
  } catch (e) {
    return "Stay hard! (Offline Mode)";
  }
};

export const generateLabel = async (text: string): Promise<string> => {
  try {
    const response = await api.ai.label({ text });
    return response.label;
  } catch (e) {
    return "General";
  }
};

export const analyzeTaskGoalSimilarity = async (
  taskDescription: string,
  activeGoals: Goal[]
): Promise<{ alignmentScore: number; justification: string; alignedGoalId?: string }> => {
  try {
    return await api.ai.analyzeGoalAlignment({ taskDescription, activeGoals });
  } catch (e) {
    return { alignmentScore: 3, justification: "Offline analysis.", alignedGoalId: undefined };
  }
};

export const generateGogginsReflectionFeedback = async (reflection: string, goals: Goal[]): Promise<string> => {
  try {
    const response = await api.ai.reflectionFeedback({ reflection, goals });
    return response.feedback;
  } catch (e) {
    return "Stay hard. (Offline)";
  }
};

export const generateGogginsDiaryFeedback = async (
  debrief: { debriefEntry: string, initialReflection?: string, tasks: Task[], earnings: number },
  goals: Goal[]
): Promise<{ feedback: string; grade: string; }> => {
  try {
    return await api.ai.diaryFeedback({ debrief, goals });
  } catch (e) {
    return { feedback: "Stay hard.", grade: "N/A" };
  }
};

export const generateGogginsReview = async (reviewData: any, goals: Goal[], sideQuests: SideQuest[]): Promise<ReviewResult> => {
  try {
    return await api.ai.review({ reviewData, goals, sideQuests });
  } catch (e) {
    return { good: ["Offline"], bad: ["Offline"], suggestions: { keep: [], remove: [], add: [] } };
  }
};

export const generateGogginsGoalChangeVerdict = async (justification: string, currentGoal: string) => {
  try {
    return await api.ai.goalChangeVerdict({ justification, currentGoal });
  } catch (e) {
    return { approved: false, feedback: "Offline." };
  }
};

export const generateAtomicHabitsSystem = async (newGoal: Goal, allGoals: Goal[], accomplishmentsSummary: any): Promise<AtomicHabitsSuggestions> => {
  try {
    return await api.ai.atomicSystem({ newGoal, allGoals, accomplishmentsSummary });
  } catch (e) {
    return { obvious: [], attractive: [], easy: [], satisfying: [] };
  }
};

export const generateGogginsGoalCompletionVerdict = async (goalDescription: string, completionProof: string) => {
  try {
    return await api.ai.goalCompletionVerdict({ goalDescription, completionProof });
  } catch (e) {
    return { approved: true, feedback: "Offline. Approved." };
  }
};

export const generateWeeklyGoalEvaluation = async (
  goalDescription: string,
  completedTasks: any[],
  purchasedRewards: PurchasedReward[]
): Promise<WeeklyGoalEvaluation> => {
  try {
    return await api.ai.evaluateWeekly({
      description: goalDescription,
      completedTasks,
      purchasedRewards
    });
  } catch (e) {
    return { alignmentScore: 3, feedback: "Evaluation offline." };
  }
};

export const generateGogginsWeeklyBriefing = async (
  previousWeekEvaluations: WeeklyGoalEvaluation[],
  nextWeekGoals: WeeklyGoal[],
  longTermGoals: Goal[]
): Promise<string> => {
  try {
    const response = await api.ai.weeklyBriefing({ previousWeekEvaluations, nextWeekGoals, longTermGoals });
    return response.briefing;
  } catch (e) {
    return "Weekly briefing offline.";
  }
};

export const generateChatResponse = async (messages: { sender: 'user' | 'ai'; content: string }[], appContext: AppContext): Promise<string> => {
  try {
    const response = await api.ai.chat({ messages }); // ignoring appContext for current simplified backend chat
    return response.response;
  } catch (e) {
    return "Offline.";
  }
};

export const generateAIAssignedTask = async (appContext: AppContext): Promise<Task> => {
  // This would ideally call backend AI agent
  return {
    id: "mock-ai-task",
    description: "Do 50 pushups now!",
    difficulty: TaskDifficulty.HARD,
    category: "Physical Training",
    completed: false,
    estimatedTime: 10,
    date: appContext.currentDate,
    actualTime: null,
  } as Task;
};

export const generateTaskFromWishList = async (appContext: AppContext): Promise<Task & { originalWishDescription: string }> => {
  // Select one random wish from list logic? 
  // Or call AI?
  const wish = appContext.wishList.length > 0 ? appContext.wishList[0] : { description: "General Improvement" };
  return {
    id: "mock-wish-task",
    description: `Work on: ${wish.description}`,
    difficulty: TaskDifficulty.MEDIUM,
    category: "Side Quest",
    completed: false,
    estimatedTime: 60,
    date: appContext.currentDate,
    actualTime: null,
    originalWishDescription: wish.description
  } as Task & { originalWishDescription: string };
};

export const generateTaskFromCoreList = async (appContext: AppContext): Promise<Task> => {
  const core = appContext.coreList.length > 0 ? appContext.coreList[0] : { description: "Run 5 miles" };
  return {
    id: "mock-core-task",
    description: core.description,
    difficulty: TaskDifficulty.SAVAGE,
    category: "Physical Training",
    completed: false,
    estimatedTime: 60,
    date: appContext.currentDate,
    actualTime: null,
  } as Task;
};

export const generateBettingOdds = async (
  task: { description: string, difficulty: TaskDifficulty, category: string, estimatedTime: number },
  context: any
): Promise<{ multiplier: number; rationale: string }> => {
  try {
    return await api.ai.bettingOdds({
      description: task.description,
      difficulty: task.difficulty,
      category: task.category,
      estimatedTime: task.estimatedTime,
      context
    });
  } catch (e) {
    return { multiplier: 2.0, rationale: "The odds are against you. Good." };
  }
};

export const enhanceText = async (text: string, type: 'mission' | 'goal' | 'weekly_objective'): Promise<string> => {
  try {
    const response = await api.ai.enhanceText({ text, type });
    return response.enhanced_text;
  } catch (e) {
    return text; // Fallback to original text if offline
  }
};


export const generatePreStateQuestions = async (context: string, whyAnswers?: string[]): Promise<{ questions: string[] }> => {
  // Stub for now to unblock build. Ideally move to backend.
  return {
    questions: [
      "Why is this important?",
      "What happens if I fail?",
      "Who is watching?"
    ]
  };
};

export const generateGoalContract = async (
  description: string,
  targetDate?: string,
  preStateAnswers?: any[],
  whyAnswers?: string[],
  type: string = "goal"
): Promise<GoalContract> => {
  try {
    return await api.ai.contract({ description, type });
  } catch (e) {
    return {
      primaryObjective: description,
      contractStatement: "I hereby pledge to destroy this goal.",
      rewardPayout: 0,
      kpis: [{ description: "Completion", type: "External Metric", target: "100%" }],
      preStateAnswers: preStateAnswers || [],
      fiveWhys: whyAnswers || ["Why?", "Why?", "Why?", "Why?", "Why?"]
    };
  }
};

export const generateWeeklyObjectiveContract = async (description: string, targetDate?: string, preState?: any[], why?: string[]): Promise<GoalContract> => {
  return generateGoalContract(description, targetDate, preState, why, "weekly");
};

export const generateWishContract = async (description: string, preState?: any[], why?: string[]): Promise<GoalContract> => {
  return generateGoalContract(description, undefined, preState, why, "wish");
};

export const generateCoreTaskContract = async (description: string, preState?: any[], why?: string[]): Promise<GoalContract> => {
  return generateGoalContract(description, undefined, preState, why, "core");
};
