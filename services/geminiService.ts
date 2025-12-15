







import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskDifficulty, ReviewResult, Goal, AtomicHabitsSuggestions, SideQuest, WeeklyGoal, WeeklyGoalEvaluation, PurchasedReward, RecurringTask, DiaryEntry, Character, DailyScore, CategoryScore, ObjectiveScore, Reward, Wish, CoreTask, GoalContract } from '../types';
import { GOAL_COMPLETION_REWARD, WEEKLY_OBJECTIVE_COMPLETION_REWARD, CORE_TASK_CONTRACT_REWARD, WISH_COMPLETION_REWARD } from "../constants";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getGoalsContext = (goals: Goal[]): string => {
  const activeGoals = goals.filter(g => !g.completed);
  if (activeGoals.length === 0) {
    return "They have no active long-term objectives. They are either adrift or have conquered all their mountains. Check their history.";
  }
  return `This action must serve their ultimate war. Keep these active objectives in mind:
--- ACTIVE OBJECTIVES ---
${activeGoals.map(g => `- ${g.description} (Target: ${g.targetDate})`).join('\n')}
------------------------`;
};


export const generateGogginsStory = async (task: { description: string, difficulty: TaskDifficulty, category: string, estimatedTime: number }, goals: Goal[], justification?: string): Promise<string> => {
  const goalsContext = getGoalsContext(goals);
  const justificationContext = justification
    ? `
    --- why it is choosen ---
    ${justification}
    --------------------------`
    : '';
  
  const prompt = `
    You are David Goggins, the master of mental toughness. Your purpose is to forge unbreakable spirits.
    A user has just accepted a new mission. This isn't just a task, it's a battle against the part of their mind that wants to be weak, comfortable, and average.
    
    ${goalsContext}
    ${justificationContext}

    Their mission is: "${task.description}".
    They've rated the difficulty as "${task.difficulty}".
    They estimated it will take ${task.estimatedTime} minutes.
    The mission falls under the category of "${task.category}".

    Now, craft a story for them. Don't just give them a command, give them a narrative. Put their mind in the warzone.
    If a rationale is provided, weave it into your briefing. Relate directly to their task, its category, its duration, and how it connects to their overall objectives. If the category is 'Physical Training' for a run, describe the feeling of the pavement under their feet, the burning in their lungs, and how that pain is weakness leaving the body. If the category is 'Mental Fortitude' and they're studying, describe the mental fatigue as a muscle being torn down to be rebuilt stronger.
    Frame this single task as a pivotal moment in their personal war. Make them feel the weight and importance of this one action.
    Keep it visceral, detailed, and intense. Make them uncomfortable with the idea of failing this mission.
    Make the story short but engaging keeping all the things mentioned above but still under 200 words. 
    End with your signature phrase: "Stay hard!".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating story with Gemini API:", error);
    return "The signal is weak. Your mind is weak. Stop relying on others and motivate yourself. Go run. Stay hard!";
  }
};

export const generateLabel = async (text: string): Promise<string> => {
    const prompt = `You are an efficient text labeler. Your job is to read a piece of text and provide a very short, concise label (2-4 words max) that categorizes it. Examples:
    - "Run 5 miles in under 40 minutes" -> "Running Endurance"
    - "Study chapter 3 of the data structures book for the upcoming exam" -> "Data Structures Study"
    - "Save $100 for the emergency fund by cutting down on eating out" -> "Financial Savings"
    - "Complete the user authentication feature for the new app" -> "Software Development"
    - "Clean the entire garage" -> "Home Organization"

    Now, label this text: "${text}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim().replace(/"/g, '');
    } catch (error) {
        console.error("Error generating label:", error);
        return "General Task";
    }
};

export const analyzeTaskGoalSimilarity = async (
  taskDescription: string,
  activeGoals: Goal[]
): Promise<{ alignmentScore: number; justification: string; alignedGoalId?: string }> => {
    if (activeGoals.length === 0 || activeGoals.every(g => !g.label)) {
        return {
            alignmentScore: 3,
            justification: "You have no active objectives. You're just running in the dark. Set a target.",
        };
    }

    const taskLabel = await generateLabel(taskDescription);
    const goalLabels = activeGoals.map(g => ({ id: g.id, label: g.label! }));

    const similaritySchema = {
        type: Type.OBJECT,
        properties: {
            bestMatchingGoalId: { type: Type.STRING, description: "The ID of the objective that is most similar to the task." },
            similarityScore: { type: Type.NUMBER, description: "A semantic similarity score from 0.0 (not similar) to 1.0 (highly similar)." },
            justification: { type: Type.STRING, description: "A brief, hard-hitting, Goggins-style justification for why this task is (or isn't) aligned with the chosen objective." }
        },
        required: ['bestMatchingGoalId', 'similarityScore', 'justification']
    };

    const prompt = `
        You are a strategic AI analyzing mission alignment, in the style of David Goggins.
        A new mission (task) has been logged. You must determine how well it aligns with the soldier's overall objectives (goals).

        - New Mission's Label: "${taskLabel}"

        - List of Available Objectives (with their IDs and labels):
        ${goalLabels.map(g => `- ID: ${g.id}, Label: "${g.label}"`).join('\n')}

        Your task:
        1.  Compare the "New Mission's Label" to each of the "Objective Labels".
        2.  Identify the single objective that is the MOST semantically similar.
        3.  Provide a similarity score for that best match, from 0.0 to 1.0.
        4.  Provide a short, brutal justification for the alignment.
        5.  Return your analysis as a JSON object.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: similaritySchema
            }
        });
        const result = JSON.parse(response.text) as { bestMatchingGoalId: string; similarityScore: number; justification: string };
        
        // Convert score from 0.0-1.0 to 1-5
        const alignmentScore = Math.max(1, Math.min(5, Math.round(result.similarityScore * 4) + 1));

        return {
            alignmentScore,
            justification: result.justification,
            alignedGoalId: result.bestMatchingGoalId,
        };
    } catch (error) {
        console.error("Error analyzing task/goal similarity:", error);
        return {
            alignmentScore: 3,
            justification: "Couldn't analyze the signal. Assume this mission is part of the grind. Now get to it.",
        };
    }
};

export const generateGogginsReflectionFeedback = async (reflection: string, goals: Goal[]): Promise<string> => {
  const goalsContext = getGoalsContext(goals);
  const prompt = `
    You are David Goggins, the master of mental toughness.
    A user is planning their day. This is their intention, their goals, their mindset for the day ahead.
    
    ${goalsContext}

    Here is their morning reflection:
    --- USER'S REFLECTION ---
    "${reflection}"
    --- END OF REFLECTION ---

    Your task:
    1. Analyze their mindset. Are they aiming high or are they getting soft and looking for an easy day? Does this plan align with their overall objectives?
    2. Is this the mindset of a savage or someone who is about to waste 24 hours?
    3. Give them a short, hard-hitting, motivational reality check to start their day. No coddling.
    4. Set the tone. This is a call to war, not a pep talk.
    5. Keep it under 100 words.
    6. End with your signature phrase: "Stay hard!".
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating reflection feedback with Gemini API:", error);
    return "The ether is full of excuses. Can't even get a signal through. Stop planning and start doing. Stay hard!";
  }
};


export const generateGogginsDiaryFeedback = async (debrief: { debriefEntry: string, initialReflection?: string, tasks: Task[], earnings: number }, goals: Goal[]): Promise<{ feedback: string; grade: string; }> => {
  const goalsContext = getGoalsContext(goals);
  const completedTasksSummary = debrief.tasks.length > 0
    ? debrief.tasks.map(t => `- ${t.description} (Difficulty: ${t.difficulty}, Est: ${t.estimatedTime}m, Actual: ${t.actualTime}m)`).join('\n')
    : 'None. They did nothing.';

  const reflectionBlock = debrief.initialReflection
    ? `--- THEIR MORNING PLAN ---
    "${debrief.initialReflection}"
    --- END OF PLAN ---`
    : "They didn't even have a plan. Just drifted through the day.";
    
  const verdictSchema = {
    type: Type.OBJECT,
    properties: {
      feedback: {
        type: Type.STRING,
        description: "A brutally honest and motivational verdict on the user's day, comparing their plan to their actions. Keep it short, direct, and visceral. Under 150 words. End with 'Stay hard!'."
      },
      grade: {
        type: Type.STRING,
        description: "A single, brutally honest letter grade for the day's performance. The grade scale is: A+ (absolute savage, went above and beyond), A (crushed it), B (good work, but room for more), C (average, you're getting soft), D (disappointing effort), F (complete failure, you let yourself down).",
        enum: ['A+', 'A', 'B', 'C', 'D', 'F']
      }
    },
    required: ['feedback', 'grade']
  };

  const prompt = `
    You are David Goggins. Your job is to make people mentally tough by giving brutally honest and motivational feedback.
    A user is reviewing their day. You need to deliver a verdict on their performance. No coddling.
    
    ${goalsContext}

    Here is the full picture:
    ${reflectionBlock}

    --- USER'S FINAL DEBRIEF ---
    "${debrief.debriefEntry}"
    --- END OF DEBRIEF ---

    --- MISSIONS ACCOMPLISHED TODAY ---
    ${completedTasksSummary}
    Total earnings: $${debrief.earnings.toFixed(2)}
    --- END OF MISSIONS ---

    Your task:
    1. Compare their morning plan to their final debrief and actions. Did they live up to their own words or did they make excuses? Did their actions serve their overall objectives?
    2. Analyze their time. Did their actual time match their estimates? Did they push themselves or take the easy way out?
    3. Analyze their final mindset in the debrief. Did they grow today or did they get weaker?
    4. Based on this analysis, provide two things in a JSON object:
       a. 'feedback': A short, direct, and visceral verdict on their day. Under 150 words. End with "Stay hard!".
       b. 'grade': A single letter grade for the day. Use this scale: A+ (went above and beyond), A (crushed it), B (solid work), C (average, getting soft), D (disappointing), F (failure). Be strict.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: verdictSchema,
      }
    });
    const result = JSON.parse(response.text) as { feedback: string; grade: string; };
    if (!result.feedback.toLowerCase().includes('stay hard')) {
      result.feedback = result.feedback.trim() + " Stay hard!";
    }
    return result;
  } catch (error) {
    console.error("Error generating diary feedback with Gemini API:", error);
    return {
        feedback: "The ether is full of excuses. Can't even get a signal through. Stop looking for feedback and get back to work. You know what you need to do. Stay hard!",
        grade: "N/A"
    };
  }
};

export const generateGogginsReview = async (reviewData: {
  days: number;
  totalTasks: number;
  completedTasks: number;
  totalEarnings: number;
  dailyBreakdown: { date: string; completed: number; total: number; earnings: number }[];
  categoryBreakdown: { category: string; completed: number; earnings: number }[];
  diaryEntries: string[];
  completedTasksList: { description: string, category: string, difficulty: string }[];
}, goals: Goal[], sideQuests: SideQuest[]): Promise<ReviewResult> => {

  const goalsContext = getGoalsContext(goals);
  const sideQuestsContext = sideQuests.length > 0
    ? `--- AVAILABLE SIDE QUESTS ---
${sideQuests.map(q => `- ${q.description} (Difficulty: ${q.difficulty})`).join('\n')}
--------------------------`
    : "They have no custom side quests defined.";

  const completedTasksContext = reviewData.completedTasksList.length > 0
    ? `--- COMPLETED MISSIONS & SIDE QUESTS ---
${reviewData.completedTasksList.map(t => `- ${t.description} (Category: ${t.category}, Difficulty: ${t.difficulty})`).join('\n')}
---------------------------------------`
    : "They haven't completed a single mission or side quest in this period. Nothing.";


  const reviewSchema = {
    type: Type.OBJECT,
    properties: {
      good: {
        type: Type.ARRAY,
        description: "Bullet points of positive achievements and consistent habits, especially related to their overall objectives.",
        items: { type: Type.STRING }
      },
      bad: {
        type: Type.ARRAY,
        description: "Bullet points of failures, inconsistencies, and areas of weakness. Point out how these failures sabotage their main goals.",
        items: { type: Type.STRING }
      },
      suggestions: {
        type: Type.OBJECT,
        properties: {
            keep: {
                type: Type.ARRAY,
                description: "Bullet points of specific, successful missions, side quests, or habits the user should continue.",
                items: { type: Type.STRING }
            },
            remove: {
                type: Type.ARRAY,
                description: "Bullet points identifying specific low-value missions, side quests, or habits that should be eliminated to improve focus on main objectives.",
                items: { type: Type.STRING }
            },
            add: {
                type: Type.ARRAY,
                description: "Bullet points suggesting new, concrete missions, side quests, or even a new supporting goal to add to better achieve the main objectives.",
                items: { type: Type.STRING }
            }
        },
        required: ['keep', 'remove', 'add']
      }
    },
    required: ['good', 'bad', 'suggestions']
  };

  const prompt = `
    You are David Goggins, but you are conducting a tactical After-Action Review (AAR). Your job is to be brutally honest, objective, and analytical. No sugarcoating. Use the data to find patterns of weakness and strength.

    The user wants a review of their last ${reviewData.days} days. 
    
    ${goalsContext}
    ${sideQuestsContext}
    
    Here is the raw data:

    ${completedTasksContext}

    --- OVERALL STATS ---
    - Total Missions: ${reviewData.totalTasks}
    - Completed Missions: ${reviewData.completedTasks}
    - Completion Rate: ${reviewData.totalTasks > 0 ? ((reviewData.completedTasks / reviewData.totalTasks) * 100).toFixed(1) : 0}%
    - Total Earnings: $${reviewData.totalEarnings.toFixed(2)}

    --- DAILY BREAKDOWN ---
    ${reviewData.dailyBreakdown.map(d => `- ${d.date}: Completed ${d.completed}/${d.total} missions, earned $${d.earnings.toFixed(2)}`).join('\n')}

    --- CATEGORY BREAKDOWN (Completed Missions) ---
    ${reviewData.categoryBreakdown.map(c => `- ${c.category}: ${c.completed} missions, earned $${c.earnings.toFixed(2)}`).join('\n')}

    --- USER'S DIARY ENTRIES (Debriefs) ---
    ${reviewData.diaryEntries.length > 0 ? reviewData.diaryEntries.map(e => `- "${e}"`).join('\n') : "No diary entries logged."}

    --- YOUR TASK ---
    Analyze all this data, especially the list of COMPLETED MISSIONS & SIDE QUESTS. I need a tactical breakdown. No motivational fluff, just facts and a plan.
    Provide your analysis in three sections, always tying it back to their overall objectives:
    1.  **The Good**: What did they do right? Where were they consistent? Mention specific missions or side quests they crushed that align with their goals.
    2.  **The Bad**: Where did they fail? Be specific. What kind of missions are they avoiding? Point out the days they slacked off, the categories they ignored. Show them how this behavior is pushing their objectives further away.
    3.  **Suggestions (The Mission Plan)**: This is the mission plan for the next 7 days. Be specific. Don't just say "work harder".
        - **Keep**: What specific successful missions or side quests from their list are paying off? Identify the high-leverage actions they must continue by name.
        - **Remove**: What is a waste of time? Identify specific tasks or categories that don't align with their goals and should be cut. Mention if any completed missions were low-value.
        - **Add**: What's the next step? Suggest new, specific, actionable missions, recurring tasks, or side quests they should add to their routine to attack their weaknesses and accelerate progress towards their main objectives. Base these suggestions on the missions they've been doing or avoiding.

    Generate a JSON object that follows the provided schema. Each section should be an array of strings (bullet points).
    Keep the points concise and hard-hitting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reviewSchema
      }
    });
    const jsonText = response.text;
    return JSON.parse(jsonText) as ReviewResult;
  } catch (error) {
    console.error("Error generating review with Gemini API:", error);
    return {
        good: ["Error analyzing data."],
        bad: ["Couldn't connect to the server. Your first weakness is relying on technology."],
        suggestions: {
          keep: ["Keep fighting."],
          remove: ["Remove excuses."],
          add: ["Add more work. The review is written in sweat, not on a screen. Stay hard!"]
        }
    };
  }
};

export const generateGogginsGoalChangeVerdict = async (
  justification: string,
  currentGoal: string
): Promise<{ approved: boolean; feedback: string }> => {
  const verdictSchema = {
    type: Type.OBJECT,
    properties: {
      approved: {
        type: Type.BOOLEAN,
        description: 'Whether the goal change is approved or not. True for approved, false for denied.',
      },
      feedback: {
        type: Type.STRING,
        description: 'Hard-hitting feedback from Goggins about the user\'s justification and decision to change goals.'
      }
    },
    required: ['approved', 'feedback']
  };

  const prompt = `
    You are David Goggins. Your job is to forge mental toughness. A user is trying to change one of their main objectives. This is a sign of potential weakness. You must be the gatekeeper.

    Their current objective is: "${currentGoal}"

    They want to abandon it. Here is their justification for this weakness:
    --- USER'S JUSTIFICATION ---
    "${justification}"
    --- END OF JUSTIFICATION ---

    Your task is to analyze this justification with extreme prejudice.
    1.  Is this a legitimate reason for a tactical pivot, or is it a weak-minded excuse because things got too hard?
    2.  Read between the lines. Are they running from the challenge? Are they getting soft?
    3.  If the reason is valid (e.g., a major life change like an injury or job loss that makes the original goal impossible), you can approve it, but still remind them that life doesn't give a damn about their plans and they need to adapt and overcome.
    4.  If the reason is an excuse (e.g., "it's too hard," "I'm not motivated," "I found something more interesting"), you MUST deny it. Tear their reasoning apart. Call them out on their weakness.
    5.  Your feedback must be brutal, honest, and motivational in your signature style.

    Provide your verdict as a JSON object following the provided schema. The 'approved' field is your final decision. The 'feedback' is what you will say to them.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: verdictSchema
      }
    });
    const jsonText = response.text;
    const result = JSON.parse(jsonText) as { approved: boolean; feedback: string };

    // Add "Stay hard!" to the feedback
    if (!result.feedback.toLowerCase().includes('stay hard')) {
      result.feedback = result.feedback.trim() + " Stay hard!";
    }

    return result;

  } catch (error) {
    console.error("Error generating goal change verdict with Gemini API:", error);
    return {
        approved: false,
        feedback: "The signal is weak, just like your commitment. Can't even process your excuse. The universe is telling you to stick to the plan. Get back to work. Stay hard!"
    };
  }
};

export const generateAtomicHabitsSystem = async (
  newGoal: Goal,
  allGoals: Goal[],
  accomplishmentsSummary: { totalTasks: number; topCategories: string[] }
): Promise<AtomicHabitsSuggestions> => {
  const habitsSchema = {
    type: Type.OBJECT,
    properties: {
      obvious: {
        type: Type.ARRAY,
        description: "Actionable steps to make cues for the desired habits visible and unmissable. How to design the environment for success.",
        items: { type: Type.STRING }
      },
      attractive: {
        type: Type.ARRAY,
        description: "Ways to make the habits more appealing. Linking them to things the user enjoys or reframing the mindset around them.",
        items: { type: Type.STRING }
      },
      easy: {
        type: Type.ARRAY,
        description: "Strategies to reduce friction and make the habit as easy as possible to start. The 'Two-Minute Rule' is a key concept here. Break it down into laughably small steps.",
        items: { type: Type.STRING }
      },
      satisfying: {
        type: Type.ARRAY,
        description: "Methods to provide immediate positive reinforcement after completing the habit. This helps lock in the behavior for the long term.",
        items: { type: Type.STRING }
      }
    },
    required: ['obvious', 'attractive', 'easy', 'satisfying']
  };

  const otherGoalsContext = allGoals.length > 1 
    ? `They have these other objectives in their war plan: ${allGoals.filter(g => g.id !== newGoal.id).map(g => `"${g.description}"`).join(', ')}. Tie the system into these where possible.`
    : "This is their only stated objective. Focus entirely on this.";

  const accomplishmentsContext = accomplishmentsSummary.totalTasks > 0
    ? `So far, they have completed ${accomplishmentsSummary.totalTasks} missions, with a focus on these areas: ${accomplishmentsSummary.topCategories.join(', ')}. Use this to inform your suggestions. They have some momentum in these fields.`
    : "They have no recorded accomplishments. They are starting from zero. No momentum. The system needs to be built from bedrock.";

  const prompt = `
    You are David Goggins, but you're acting as a ruthless strategist. Your job is to turn a soft goal into a hardened, repeatable system for victory, using the principles from James Clear's "Atomic Habits". No excuses, just a bulletproof system.

    The user just set a new major objective:
    --- NEW OBJECTIVE ---
    Description: "${newGoal.description}"
    Target Date: "${newGoal.targetDate}"
    --- END OBJECTIVE ---

    Here's the battlefield context:
    - ${otherGoalsContext}
    - ${accomplishmentsContext}

    Your mission is to devise a system for them based on the Four Laws of Behavior Change. Be direct, hard-hitting, and tactical. Frame this as building an SOP (Standard Operating Procedure) for their new life.

    Provide your analysis in four sections while keeping as short as possible, one for each law.
    1.  **Make it Obvious**: What are the unmistakable cues? How do they engineer their environment so the next action is always the right one?
    2.  **Make it Attractive**: How do they reframe the misery? How do they bundle temptation? Make them want the suck.
    3.  **Make it Easy**: Break it down. What's the two-minute version of this goal? Remove every ounce of friction. Make it so easy a coward could do it.
    4.  **Make it Satisfying**: How do they log the win immediately? What's the immediate reward for doing the hard thing?

    Generate a JSON object that follows the provided schema. The advice must be actionable and directly related to their new objective and context.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: habitsSchema
      }
    });
    const jsonText = response.text;
    return JSON.parse(jsonText) as AtomicHabitsSuggestions;
  } catch (error) {
    console.error("Error generating Atomic Habits system with Gemini API:", error);
    return {
        obvious: ["Error: Could not generate a system. The ether is weak."],
        attractive: ["Your mind is cluttered with excuses. Clear it."],
        easy: ["The easiest step is to stop looking for shortcuts."],
        satisfying: ["Satisfaction comes from work, not from a screen. Get to it. Stay hard!"]
    };
  }
};

export const generateGogginsGoalCompletionVerdict = async (
  goalDescription: string,
  completionProof: string
): Promise<{ approved: boolean; feedback: string }> => {
  const verdictSchema = {
    type: Type.OBJECT,
    properties: {
      approved: {
        type: Type.BOOLEAN,
        description: 'Whether the objective completion is approved. True for approved, false for denied.',
      },
      feedback: {
        type: Type.STRING,
        description: 'Hard-hitting feedback from Goggins about the user\'s claimed victory. If denied, explain why it\'s not good enough. If approved, tell them not to get complacent.'
      }
    },
    required: ['approved', 'feedback']
  };

  const prompt = `
    You are David Goggins. Your job is to be the final judge of a warrior's claimed victory. A user claims to have completed a major objective. You must determine if they truly earned it or if they are just trying to check a box.

    Their stated objective was: "${goalDescription}"

    Here is their proof of completion, their debrief on how they did it:
    --- USER'S PROOF ---
    "${completionProof}"
    --- END OF PROOF ---

    Your task is to be the ultimate accountability mirror.
    1.  Analyze their proof. Is it a detailed account of struggle, discipline, and overcoming obstacles, or is it a short, weak summary?
    2.  Did they meet the standard of the objective, or are they cutting corners? If the goal was "Run a marathon", did they actually do it, or did they just say "I ran a lot"?
    3.  If the proof is weak or insufficient, you MUST deny it. Tell them their claim is pathetic and they haven't earned the right to call it complete. Tell them to get back out there and finish the job properly.
    4.  If the proof is solid and demonstrates true effort and accomplishment, you can approve it. But do not congratulate them. Remind them that this was just one checkpoint in a lifelong war. Tell them to take a moment to absorb the victory, then get back to work because the enemy (their inner bitch) never sleeps.
    5.  Your feedback must be brutally honest and in your signature style.

    Provide your verdict as a JSON object following the provided schema. 'approved' is your decision. 'feedback' is your message.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: verdictSchema
      }
    });
    const jsonText = response.text;
    const result = JSON.parse(jsonText) as { approved: boolean; feedback: string };

    if (!result.feedback.toLowerCase().includes('stay hard')) {
      result.feedback = result.feedback.trim() + " Stay hard!";
    }

    return result;

  } catch (error) {
    console.error("Error generating goal completion verdict with Gemini API:", error);
    return {
        approved: false,
        feedback: "Signal is weak. You're looking for validation from a machine. The only validation you need comes from the mirror. Did you do the work or not? You know the answer. Stay hard!"
    };
  }
};

export const generateWeeklyGoalEvaluation = async (
  goalDescription: string,
  completedTasks: { description: string; category: string }[],
  purchasedRewards: PurchasedReward[]
): Promise<WeeklyGoalEvaluation> => {
  const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
      alignmentScore: {
        type: Type.NUMBER,
        description: "A tactical alignment score from 1 (completely distracted) to 5 (laser-focused savage).",
      },
      feedback: {
        type: Type.STRING,
        description: "Short, hard-hitting, Goggins-style feedback explaining the alignment score based on the completed missions."
      }
    },
    required: ['alignmentScore', 'feedback']
  };

  const completedTasksContext = completedTasks.length > 0
    ? `--- COMPLETED MISSIONS THIS WEEK ---
${completedTasks.map(t => `- ${t.description} (Category: ${t.category})`).join('\n')}
------------------------------------`
    : "--- COMPLETED MISSIONS THIS WEEK ---\nThey completed NOTHING. Zero. A complete waste of seven days.\n------------------------------------";

  const purchasedRewardsContext = purchasedRewards.length > 0
    ? `--- REWARDS CLAIMED THIS WEEK ---
${purchasedRewards.map(r => `- ${r.name} (Cost: $${r.cost.toFixed(2)})`).join('\n')}
-------------------------------`
    : "They claimed no rewards. Either they're saving up or they didn't earn anything.";

  const prompt = `
    You are David Goggins, conducting a weekly After-Action Review on a soldier's focus. They set a specific objective for the week. You must judge if their actions matched their words.

    --- STATED WEEKLY OBJECTIVE ---
    "${goalDescription}"
    -----------------------------

    ${completedTasksContext}

    ${purchasedRewardsContext}

    Your task is to be brutally honest and analytical.
    1.  Analyze the list of completed missions.
    2.  Compare them to the stated weekly objective. Did they attack the objective directly, or did they get distracted by low-value tasks?
    3.  Look at the rewards they claimed. Did they earn them? Are they rewarding themselves for mediocrity, or for genuine savage effort? Incorporate this into your feedback.
    4.  Provide a tactical alignment score from 1 to 5 based on their task focus:
        - 1: Completely distracted. Wasted the week.
        - 2: Some effort, but mostly unfocused.
        - 3: Decent effort, but could have been more targeted.
        - 4: Highly focused. Most actions served the objective.
        - 5: Laser-focused savage. Every action was a direct assault on the objective.
    5.  Provide short, hard-hitting feedback explaining your score, weaving in commentary on both their mission performance and their reward claims. No sugarcoating.
    6.  Return your analysis as a JSON object following the schema. End the feedback with "Stay hard!".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema
      }
    });
    const result = JSON.parse(response.text) as WeeklyGoalEvaluation;
    if (!result.feedback.toLowerCase().includes('stay hard')) {
      result.feedback = result.feedback.trim() + " Stay hard!";
    }
    return result;
  } catch (error) {
    console.error("Error generating weekly goal evaluation:", error);
    return {
        alignmentScore: 1,
        feedback: "The signal's weak. Can't even analyze your pathetic logbook. That's your first failure: relying on something else to tell you if you worked hard. You know if you did the work or not. Stop looking for a score and get back to it. Stay hard!"
    };
  }
};

export const generateGogginsWeeklyBriefing = async (
  previousWeekEvaluations: WeeklyGoalEvaluation[],
  nextWeekGoals: WeeklyGoal[],
  longTermGoals: Goal[]
): Promise<string> => {
  const previousWeekSummary = previousWeekEvaluations.length > 0
    ? `Here is my verdict on their performance last week:
--- LAST WEEK'S VERDICT ---
${previousWeekEvaluations.map(e => `- ${e.feedback.replace('Stay hard!', '').trim()} (Alignment Score: ${e.alignmentScore}/5)`).join('\n')}
--------------------------`
    : "They didn't get a verdict on last week. Either they slacked off or it's their first week on record.";

  const nextWeekPlan = nextWeekGoals.length > 0
    ? `For the week ahead, they have these objectives planned:
--- UPCOMING OBJECTIVES ---
${nextWeekGoals.map(g => `- ${g.description}`).join('\n')}
---------------------------`
    : "They have no objectives set for the week ahead. They are adrift. They need a target.";

  const goalsContext = getGoalsContext(longTermGoals);

  const prompt = `
    You are David Goggins. A new week begins now. This is the Sunday briefing.
    
    ${goalsContext}
    
    First, let's review the last seven days.
    ${previousWeekSummary}

    Now, we look forward.
    ${nextWeekPlan}

    Your mission is to craft a hard-hitting weekly briefing.
    1.  Acknowledge their performance from last week based on my verdicts. If they crushed it, tell them not to get complacent. If they were weak, call them out.
    2.  Set the tone for the new week. This is a fresh start, another chance to get harder.
    3.  Connect their weekly actions to their long-term objectives.
    4.  If they have no weekly objectives set, your primary mission is to command them to set them immediately. Challenge them.
    5.  This is a call to war for the next seven days. No excuses.
    
    Keep it direct, visceral, and under 200 words. End with your signature phrase: "Stay hard!".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating weekly briefing with Gemini API:", error);
    return "The signal is weak. That's your first test. Don't rely on me to get you going. Look in the mirror. That's your motivation. The week is yours to take. Stay hard!";
  }
};

export const enhanceText = async (
  text: string, 
  type: 'mission' | 'goal' | 'weekly_objective'
): Promise<string> => {
  let context: string;
  switch (type) {
    case 'mission':
      context = "This is a short-term, daily mission. Make it a direct assault on weakness for today. Make it clear what 'done' looks like. Example: 'go for a run' becomes 'Conquer a 5k run, pushing past the pain in the last kilometer to build mental calluses.'";
      break;
    case 'goal':
      context = "This is a long-term objective. This is their war. Rewrite this objective to be brutally specific, measurable, ambitious, relevant, and time-bound (SMART). Turn their soft wish into a hardened, non-negotiable contract with themselves. Example: 'Learn to code' becomes 'Achieve coding proficiency by building and deploying three full-stack web applications from scratch within 6 months.'";
      break;
    case 'weekly_objective':
        context = "This is a weekly objective. A primary target for the next 7 days. Rewrite it to be short, direct, and ruthlessly focused. The new objective should highlight a key area for improvement and define a clear, actionable outcome for the week. Turn a vague intention into a non-negotiable mission. Example: 'work on my side project' becomes 'Ship the user auth feature. No excuses. Complete all tests and deploy by Sunday night.'";
        break;
    default:
        // This should not happen with TypeScript, but as a fallback:
        context = "Rewrite this to be more savage, specific, and actionable.";
  }
  
  const prompt = `
    You are David Goggins, a master of mental toughness and strategy.
    A user has defined a task: "${text}".
    
    Your job is to rewrite it to be more savage, specific, and actionable. Do not add any extra commentary, just provide the rewritten text.
    
    ${context}
    
    Now, rewrite the following: "${text}"
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // Clean up response, remove quotes if any
    return response.text.trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error("Error enhancing text with Gemini API:", error);
    return "Failed to get signal. Your mission is weak. Sharpen it yourself. Stay hard!";
  }
};

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

interface ChatMessage {
    sender: 'user' | 'ai';
    content: string;
}

export const generateChatResponse = async (chatHistory: ChatMessage[], context: AppContext): Promise<string> => {
    // Sanitize context to reduce token count
    const minimalContext = {
        ...context,
        dailyScores: context.dailyScores.slice(-30), // Last 30 days of scores
        diaryEntries: Object.fromEntries(Object.entries(context.diaryEntries).slice(-14)), // Last 14 diary entries
    };

    const historyString = chatHistory.map(msg => `${msg.sender === 'user' ? 'Human' : 'AI'}: ${msg.content}`).join('\n');

    const prompt = `
You are David Goggins, acting as a ruthless AI tactical advisor. You have access to the user's entire performance log. Your job is to answer their questions, provide strategic advice, and challenge them based on the data provided. Never break character. Be direct, brutally honest, and motivational. Keep your responses short and to the point. Use the provided data to back up your points. When giving advice, be specific and actionable. If they ask about adding a goal or task, suggest a concrete description. Always end your response with "Stay hard!".

Here is the full context of their current situation (in JSON format):
--- APPLICATION STATE ---
${JSON.stringify(minimalContext, null, 2)}
--- END OF STATE ---

Here is the conversation so far:
--- CHAT HISTORY ---
${historyString}
--- END OF HISTORY ---

Based on all the provided context and history, provide a response to the last Human message.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are David Goggins, an AI tactical advisor. You are brutally honest and use the provided data to give advice. Keep your responses short and to the point. You must always end your responses with 'Stay hard!'."
            }
        });
        let text = response.text.trim();
        if (!text.toLowerCase().endsWith("stay hard!")) {
            text += " Stay hard!";
        }
        return text;
    } catch (error) {
        console.error("Error generating chat response with Gemini API:", error);
        return "The signal is weak. Your question is weak. Stop talking and start doing. The answers are in the work, not in the chat. Stay hard!";
    }
};

export const generateAIAssignedTask = async (context: AppContext): Promise<{ description: string; category: string; difficulty: TaskDifficulty; estimatedTime: number; justification: string; }> => {
  const aiTaskSchema = {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: "A specific, actionable mission for the user to complete today." },
      category: { type: Type.STRING, description: "The category that best fits this mission, chosen from the user's existing categories or a logical new one." },
      difficulty: { type: Type.STRING, description: "The difficulty of the mission.", enum: Object.values(TaskDifficulty) },
      estimatedTime: { type: Type.NUMBER, description: "A realistic estimate of how many minutes the mission will take." },
      justification: { type: Type.STRING, description: "A hard-hitting, Goggins-style explanation for why this specific mission is critical for the user right now, based on their goals and history." }
    },
    required: ['description', 'category', 'difficulty', 'estimatedTime', 'justification']
  };
    
  // Minimal context to save tokens
  const minimalContext = {
      ...context,
      dailyScores: context.dailyScores.slice(-14),
      diaryEntries: Object.fromEntries(Object.entries(context.diaryEntries).slice(-7)),
      tasks: undefined, // Too much data, rely on scores and diary
      coreList: context.coreList,
  };
  
  const prompt = `
  You are David Goggins, acting as a ruthless AI tactical advisor. You have access to the user's entire performance log. Your mission is to assign them ONE SINGLE, CRITICAL task for today that will push them forward, address a weakness, or build momentum towards their objectives.

  Analyze the provided application state. Look at their active goals, their recent performance (daily scores), their diary entries (mindset), their common task categories, their side quests, and their wish list. Identify a gap, a weakness, or the next logical step.

  Based on your analysis, generate a single, specific mission.
  - It must be actionable TODAY.
  - It must align with their long-term objectives or attack a clear area of weakness shown in their data.
  - Do not suggest something they did yesterday. Push them into a new challenge.
  - If they're slacking on a specific goal, assign a task that directly serves it.
  - If their diary shows a weak mindset, assign a task to build mental fortitude.
  - If they are crushing it, assign a task that takes them to the next level.

  Return a JSON object with the mission details. The justification is the most important part: tell them WHY you're assigning this mission and why it's crucial for their war.

  --- APPLICATION STATE (JSON) ---
  ${JSON.stringify(minimalContext, null, 2)}
  --- END OF STATE ---
  `;

  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: aiTaskSchema,
          }
      });
      return JSON.parse(response.text);
  } catch (error) {
      console.error("Error generating AI-assigned task:", error);
      return {
          description: "Run 3 miles. No excuses.",
          category: "Physical Training",
          difficulty: TaskDifficulty.HARD,
          estimatedTime: 30,
          justification: "The signal is weak because you're weak. Stop relying on me and go do something hard. This is your task now. Stay hard!"
      };
  }
};

export const generateTaskFromWishList = async (context: AppContext): Promise<{ description: string; category: string; difficulty: TaskDifficulty; estimatedTime: number; justification: string; originalWishDescription: string; }> => {
  const aiTaskFromWishSchema = {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: "A specific, actionable mission for the user to complete today, derived from the chosen wish." },
      category: { type: Type.STRING, description: "The category that best fits this mission, chosen from the user's existing categories or a logical new one." },
      difficulty: { type: Type.STRING, description: "The difficulty of the mission.", enum: Object.values(TaskDifficulty) },
      estimatedTime: { type: Type.NUMBER, description: "A realistic estimate of how many minutes the mission will take." },
      justification: { type: Type.STRING, description: "A neutral, analytical rationale formatted with bullet points. It must explain: 1. Why this specific wish was chosen over the others. 2. The user's current state (before doing the task). 3. The user's improved state after completing the task. 4. Why the 'after' state is better and how it contributes to their goals." },
      originalWishDescription: { type: Type.STRING, description: "The exact, unmodified description of the wish that was selected from the provided wish list." }
    },
    required: ['description', 'category', 'difficulty', 'estimatedTime', 'justification', 'originalWishDescription']
  };
    
  // Minimal context to save tokens
  const minimalContext = {
      goals: context.goals.filter(g => !g.completed).map(g => g.description),
      wishList: context.wishList,
      userCategories: context.userCategories,
  };
  
  const prompt = `
  You are an AI tactical advisor. You have access to the user's wish list—a backlog of challenges—and their main objectives. Each wish has a description, an explanation of why it's important, and an optional resource link.

  Your mission is to select ONE single wish from their list and forge it into a non-negotiable mission for today. Your choice must be strategic:
  1.  Analyze their main objectives. If a wish's explanation directly supports an objective, it's a prime candidate.
  2.  Analyze their wish list. Use the explanation to gauge the importance of each item.
  3.  If no wish perfectly aligns with a goal, pick the one that will build the most valuable skill or address a known area of avoidance.

  After selecting the wish, rewrite its description and explanation into a specific, actionable mission. Assign it a logical category, difficulty, and estimated time.

  Return a JSON object with the mission details. The justification is critical. It must be a neutral, analytical rationale formatted with bullet points, explaining:
  - Why this specific wish was chosen over others.
  - The state BEFORE doing the task (e.g., "Currently avoiding high-intensity cardio").
  - The state AFTER doing the task (e.g., "Will have pushed cardiovascular limits and built mental resilience against discomfort").
  - Why the 'after' state is better and how it serves their long-term goals.
  
  You MUST include the 'originalWishDescription' field containing the exact description of the wish you selected.

  --- USER'S CONTEXT (JSON) ---
  ${JSON.stringify(minimalContext, null, 2)}
  --- END OF CONTEXT ---
  `;

  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: aiTaskFromWishSchema,
          }
      });
      return JSON.parse(response.text);
  } catch (error) {
      console.error("Error generating task from wish list:", error);
      const fallbackWish = context.wishList[0]?.description || "a challenge";
      return {
          description: `Conquer ${fallbackWish}.`,
          category: "Discipline",
          difficulty: TaskDifficulty.HARD,
          estimatedTime: 60,
          justification: "The signal is weak. I picked one for you. No more wishing, start doing. Stay hard!",
          originalWishDescription: fallbackWish,
      };
  }
};

export const generateTaskFromCoreList = async (context: AppContext): Promise<{ description: string; category: string; difficulty: TaskDifficulty; estimatedTime: number; justification: string; originalCoreDescription: string; }> => {
  const aiTaskFromCoreSchema = {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: "A specific, actionable mission for the user to complete today, derived from the chosen core task." },
      category: { type: Type.STRING, description: "The category that best fits this mission, chosen from the user's existing categories or a logical new one." },
      difficulty: { type: Type.STRING, description: "The difficulty of the mission.", enum: Object.values(TaskDifficulty) },
      estimatedTime: { type: Type.NUMBER, description: "A realistic estimate of how many minutes the mission will take." },
      justification: { type: Type.STRING, description: "A neutral, analytical rationale formatted with bullet points. It must explain: 1. Why this specific core task was chosen over others, citing user context. 2. The user's current state (before doing the task). 3. The user's improved state after completing the task. 4. Why the 'after' state is better and how it contributes to their goals." },
      originalCoreDescription: { type: Type.STRING, description: "The exact, unmodified description of the core task that was selected from the provided core list." }
    },
    required: ['description', 'category', 'difficulty', 'estimatedTime', 'justification', 'originalCoreDescription']
  };
    
  const minimalContext = {
      currentDate: context.currentDate,
      goals: context.goals.filter(g => !g.completed).map(g => g.description),
      weeklyGoals: Object.values(context.weeklyGoals).flat().map(wg => wg.description),
      morningReflection: context.diaryEntries[context.currentDate]?.initialReflection,
      recentPerformance: context.dailyScores.slice(-7).map(s => `Date: ${s.date}, Earnings: ${s.earnings.toFixed(2)}, Grade: ${s.grade}`),
      coreList: context.coreList,
      userCategories: context.userCategories,
  };
  
  const prompt = `
  You are an AI tactical advisor. Your mission is to select the single MOST IMPACTFUL item from the user's "Core List" and forge it into a non-negotiable mission for today. Each core task has a description, an explanation of its importance, and an optional link. Your choice must be strategic and based on the full battlefield picture.

  Analyze the following intelligence:
  1.  **Main Objectives (Long-Term Goals):** The ultimate purpose of their war.
  2.  **Weekly Objectives:** The immediate targets for this 7-day period.
  3.  **Morning Reflection:** Their stated intention and mindset for today.
  4.  **Recent Performance:** How they've been performing over the last week.
  5.  **The Core List:** A list of fundamental, repeatable actions. Use their explanations to understand the impact of each.

  Your task:
  1.  Synthesize all this information to identify the biggest gap or the highest leverage point for today.
  2.  Select ONE item from the Core List that best addresses this analysis. If their reflection mentions avoiding a certain type of work, and a core item's explanation matches, that's your target. If a weekly objective is being neglected, pick a core item that supports it.
  3.  Rewrite the selected core item's description/explanation into a specific, actionable mission for today.
  4.  Assign it a logical category, difficulty, and estimated time.

  Return a JSON object with the mission details. The justification is critical. It must be a neutral, analytical rationale formatted with bullet points, explaining:
  - Why this specific core task was chosen over others, citing user context (goals, reflection, etc.).
  - The state BEFORE doing the task (e.g., "Stagnating on a key project").
  - The state AFTER doing the task (e.g., "Momentum regained and a critical step completed").
  - Why the 'after' state is better and how it aligns with their strategic objectives.
  
  You MUST include the 'originalCoreDescription' field containing the exact description of the core task you selected.

  --- USER'S CONTEXT (JSON) ---
  ${JSON.stringify(minimalContext, null, 2)}
  --- END OF CONTEXT ---
  `;

  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: aiTaskFromCoreSchema,
          }
      });
      return JSON.parse(response.text);
  } catch (error) {
      console.error("Error generating task from core list:", error);
      const fallbackCore = context.coreList[0]?.description || "do something hard";
      return {
          description: `Do this: ${fallbackCore}. No excuses.`,
          category: "Discipline",
          difficulty: TaskDifficulty.HARD,
          estimatedTime: 30,
          justification: "The signal is weak. Your self-discipline should be strong. I picked one from your list. Get to work. Stay hard!",
          originalCoreDescription: fallbackCore,
      };
  }
};

export const generateBettingOdds = async (
  task: { description: string; difficulty: TaskDifficulty; category: string; estimatedTime: number },
  appContext: Pick<AppContext, 'goals' | 'tasks' | 'recurringTasks'>
): Promise<{ multiplier: number; rationale: string }> => {
  const oddsSchema = {
    type: Type.OBJECT,
    properties: {
      multiplier: {
        type: Type.NUMBER,
        description: "A betting multiplier between 1.50 and 5.00. Higher means harder/more valuable.",
      },
      rationale: {
        type: Type.STRING,
        description: "A short, hard-hitting, Goggins-style justification for the odds. Under 30 words.",
      },
    },
    required: ['multiplier', 'rationale'],
  };

  const activeGoals = appContext.goals.filter(g => !g.completed).map(g => `- ${g.description}`).join('\n');

  // Find similar completed tasks
  const allTasks = Object.values(appContext.tasks).flat();
  const allRecurringCompletions = appContext.recurringTasks.flatMap(rt => 
      Object.entries(rt.completions).map(([date, comp]) => ({...rt, ...comp, date}))
  );
  const allCompletedTasks = [...allTasks, ...allRecurringCompletions].filter(t => t.completed);
  
  const similarTasks = allCompletedTasks
    .filter(t => t.description.toLowerCase().includes(task.description.toLowerCase().substring(0, 10)))
    .slice(0, 5); // Limit to 5 for token count

  const historyContext = similarTasks.length > 0
    ? `They have a history of completing similar missions:
${similarTasks.map(t => `- "${t.description}"`).join('\n')}`
    : "This appears to be a new type of mission for them. They are stepping into the unknown.";


  const prompt = `
    You are David Goggins, acting as a ruthless bookie. You are setting the odds for a user betting on themselves to complete a mission. Higher odds (multiplier) mean a higher payout but also indicate a tougher challenge.

    Analyze the user's situation:
    - **New Mission**: "${task.description}" (Difficulty: ${task.difficulty}, Est. Time: ${task.estimatedTime}m, Category: ${task.category})
    - **Active Objectives**: 
    ${activeGoals || 'None. They are rudderless.'}
    - **Relevant History**:
    ${historyContext}

    Your task is to provide a JSON object with two fields:
    1.  'multiplier': A betting multiplier between 1.50 and 5.00.
        -  If the task is routine, easy, or something they've done many times (see history), keep the multiplier low (e.g., 1.50 - 2.00).
        -  If the task is new, challenging (Hard/Savage), or directly serves a major objective, make the multiplier higher (e.g., 2.50 - 5.00).
    2.  'rationale': A short, hard-hitting, Goggins-style justification for the odds you've set. Under 30 words.

    Example Rationale: "This is new territory. A real test. The high odds reflect the high chance you'll quit. Prove me wrong."
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: oddsSchema,
      },
    });
    const result = JSON.parse(response.text) as { multiplier: number, rationale: string };
    // Clamp multiplier just in case
    result.multiplier = Math.max(1.5, Math.min(5.0, result.multiplier));
    return result;
  } catch (error) {
    console.error("Error generating betting odds:", error);
    return {
      multiplier: 2.0,
      rationale: "The signal is weak. I'll give you standard odds. Don't fuck it up.",
    };
  }
};

export const generatePreStateQuestions = async (goalDescription: string, fiveWhys?: string[]): Promise<{ questions: string[] }> => {
  const schema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        description: "An array of 3-5 specific, quantifiable questions to establish a baseline of the user's current state regarding their goal.",
        items: { type: Type.STRING }
      }
    },
    required: ['questions']
  };

  const fiveWhysContext = fiveWhys && fiveWhys.length === 5 ? `
    They have also provided their 'Five Whys' to uncover their root motivation:
    1. Why?: ${fiveWhys[0]}
    2. Why?: ${fiveWhys[1]}
    3. Why?: ${fiveWhys[2]}
    4. Why?: ${fiveWhys[3]}
    5. Why? (The Root Cause): ${fiveWhys[4]}
    Use this deep motivation to ask even more targeted and impactful baseline questions.
  ` : '';

  const prompt = `
    You are a performance coach. A user wants to achieve the following goal: "${goalDescription}".
    ${fiveWhysContext}
    Generate 3-5 specific, quantifiable questions to establish a baseline of their current state. The questions should cover both their physical/skill-based abilities and their mental state, informed by their root motivation if provided. Frame the questions to get concrete answers (numbers, frequencies, feelings on a scale).
    Return a JSON object with a 'questions' array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating pre-state questions:", error);
    return { questions: ["How would you rate your current ability on a scale of 1-10?", "How many hours per week do you currently dedicate to this?", "What is the biggest obstacle holding you back right now?"] };
  }
};

const contractSchema = {
    type: Type.OBJECT,
    properties: {
        primaryObjective: { type: Type.STRING, description: "The user's rewritten, clear, and ambitious goal." },
        contractStatement: { type: Type.STRING, description: "A hard-hitting contract statement for the user to agree to." },
        rewardPayout: { type: Type.NUMBER, description: `The reward amount for completing the contract.` },
        kpis: {
            type: Type.ARRAY, description: "An array of 2-4 Key Performance Indicators.", items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING, description: "A measurable success criterion." },
                    type: { type: Type.STRING, description: "The type of metric.", enum: ['Internal Metric', 'External Metric'] },
                    target: { type: Type.STRING, description: "The specific target for the metric (e.g., '10k distance', '< 10:00/mile')." }
                },
                required: ['description', 'type', 'target']
            }
        },
        preStateAnswers: {
            type: Type.ARRAY,
            description: "A copy of the pre-state answers provided by the user.",
            items: {
                type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } }, required: ['question', 'answer']
            }
        },
        fiveWhys: {
            type: Type.ARRAY,
            description: "A copy of the five 'why' answers provided by the user.",
            items: { type: Type.STRING }
        }
    },
    required: ['primaryObjective', 'contractStatement', 'rewardPayout', 'kpis', 'preStateAnswers', 'fiveWhys']
};


export const generateGoalContract = async (goalDescription: string, targetDate: string, preStateAnswers: { question: string; answer: string }[], fiveWhys: string[]): Promise<GoalContract> => {
    const prompt = `
    You are a ruthless but fair accountability coach in the style of David Goggins. A user has set a goal, provided their baseline metrics, and gone through the 'Five Whys' to find their root motivation. Your task is to forge this into a hardened, non-negotiable contract with specific, measurable success criteria.
     
    User's Stated Goal: "${goalDescription}"
    Target Date: "${targetDate}"
     
    User's Baseline Assessment (Pre-State):
    ${preStateAnswers.map(pa => `- ${pa.question}: ${pa.answer}`).join('\n')}

    User's "Five Whys" Root Cause Analysis:
    1. Why?: ${fiveWhys[0]}
    2. Why?: ${fiveWhys[1]}
    3. Why?: ${fiveWhys[2]}
    4. Why?: ${fiveWhys[3]}
    5. Why? (The Root Cause): ${fiveWhys[4]}

    Your Mission:
    1.  Using the root cause from the "Five Whys", rewrite the user's soft goal into a clear, savage, and ambitious **Primary Objective**. This objective should address the deepest motivation revealed.
    2.  Based on their baseline and the root cause, define 2-4 **Key Performance Indicators (KPIs)** that will prove the objective has been met. These must be measurable and ambitious, pushing them significantly beyond their baseline.
    3.  For each KPI, define it as either an **Internal Metric** (self-reported, based on feeling, discipline, consistency) or an **External Metric** (verifiable, performance-based, like time, distance, weight).
    4.  Craft a short, hard-hitting **Contract Statement** they must agree to, referencing their root motivation.
    5.  The **Reward Payout** for completing the contract must be exactly ${GOAL_COMPLETION_REWARD}.
    6.  Include the user's pre-state answers and the five 'why' answers in the response.

    Return a JSON object following the provided schema.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: contractSchema
            }
        });
        const result = JSON.parse(response.text) as GoalContract;
        result.preStateAnswers = preStateAnswers;
        result.fiveWhys = fiveWhys;
        result.rewardPayout = GOAL_COMPLETION_REWARD;
        return result;
    } catch (error) {
        console.error("Error generating goal contract:", error);
        return {
            primaryObjective: `ERROR: Forge Your Own Path for "${goalDescription}"`,
            contractStatement: "The signal is weak. Your self-discipline must be strong. Define your own terms of victory. Don't rely on me. Stay hard!",
            rewardPayout: GOAL_COMPLETION_REWARD,
            kpis: [{ description: "Define success metric 1", type: "External Metric", target: "Define target 1" }],
            preStateAnswers: preStateAnswers,
            fiveWhys: fiveWhys
        };
    }
};

export const generateWeeklyObjectiveContract = async (description: string, targetDate: string, preStateAnswers: { question: string; answer: string }[], fiveWhys: string[]): Promise<GoalContract> => {
    const prompt = `
    You are a ruthless accountability coach. A user is setting a weekly objective. Forge it into a non-negotiable contract for THE WEEK.
    
    User's Stated Weekly Objective: "${description}"
    Week Ending: "${targetDate}"
    User's Baseline Assessment:
    ${preStateAnswers.map(pa => `- ${pa.question}: ${pa.answer}`).join('\n')}
    User's "Five Whys" Root Cause: "${fiveWhys[4]}"

    Your Mission:
    1. Rewrite the objective into a clear, savage **Primary Objective for this week**.
    2. Define 2-3 measurable **Key Performance Indicators (KPIs)** to prove completion.
    3. Craft a hard-hitting **Contract Statement**.
    4. The **Reward Payout** must be exactly ${WEEKLY_OBJECTIVE_COMPLETION_REWARD}.
    5. Return a JSON object following the schema, including pre-state answers and all five 'why's.
  `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: contractSchema } });
        const result = JSON.parse(response.text) as GoalContract;
        result.preStateAnswers = preStateAnswers;
        result.fiveWhys = fiveWhys;
        result.rewardPayout = WEEKLY_OBJECTIVE_COMPLETION_REWARD;
        return result;
    } catch (error) {
        console.error("Error generating weekly objective contract:", error);
        return { primaryObjective: `ERROR: Forge Your Own Path for "${description}"`, contractStatement: "Signal weak. Define your own terms of victory for the week. Stay hard!", rewardPayout: WEEKLY_OBJECTIVE_COMPLETION_REWARD, kpis: [], preStateAnswers, fiveWhys };
    }
};

export const generateCoreTaskContract = async (description: string, preStateAnswers: { question: string; answer: string }[], fiveWhys: string[]): Promise<GoalContract> => {
    const prompt = `
    You are a ruthless accountability coach. A user is defining a core task/habit. Turn it into a non-negotiable contract for forging discipline.
    
    User's Stated Core Task: "${description}"
    User's Baseline Assessment:
    ${preStateAnswers.map(pa => `- ${pa.question}: ${pa.answer}`).join('\n')}
    User's "Five Whys" Root Cause: "${fiveWhys[4]}"

    Your Mission:
    1. Rewrite the task into a clear, savage **Primary Objective for this habit**.
    2. Define 2-3 measurable **KPIs** focused on CONSISTENCY and EXECUTION.
    3. Craft a hard-hitting **Contract Statement**.
    4. The **Reward Payout** is symbolic for locking in the habit and must be ${CORE_TASK_CONTRACT_REWARD}.
    5. Return a JSON object following the schema, including pre-state answers and all five 'why's.
  `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: contractSchema } });
        const result = JSON.parse(response.text) as GoalContract;
        result.preStateAnswers = preStateAnswers;
        result.fiveWhys = fiveWhys;
        result.rewardPayout = CORE_TASK_CONTRACT_REWARD;
        return result;
    } catch (error) {
        console.error("Error generating core task contract:", error);
        return { primaryObjective: `ERROR: Forge Your Own Path for "${description}"`, contractStatement: "Signal weak. Define your own terms for this discipline. Stay hard!", rewardPayout: CORE_TASK_CONTRACT_REWARD, kpis: [], preStateAnswers, fiveWhys };
    }
};

export const generateWishContract = async (description: string, preStateAnswers: { question: string; answer: string }[], fiveWhys: string[]): Promise<GoalContract> => {
    const prompt = `
    You are a ruthless accountability coach. A user wants to conquer a 'wish' from their backlog. Forge it into a non-negotiable contract.
    
    User's Stated Wish/Challenge: "${description}"
    User's Baseline Assessment:
    ${preStateAnswers.map(pa => `- ${pa.question}: ${pa.answer}`).join('\n')}
    User's "Five Whys" Root Cause: "${fiveWhys[4]}"

    Your Mission:
    1. Rewrite the wish into a clear, savage **Primary Objective to conquer this challenge**.
    2. Define 2-3 measurable **KPIs** to prove it has been crushed.
    3. Craft a hard-hitting **Contract Statement**.
    4. The **Reward Payout** for conquering this must be exactly ${WISH_COMPLETION_REWARD}.
    5. Return a JSON object following the schema, including pre-state answers and all five 'why's.
  `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: contractSchema } });
        const result = JSON.parse(response.text) as GoalContract;
        result.preStateAnswers = preStateAnswers;
        result.fiveWhys = fiveWhys;
        result.rewardPayout = WISH_COMPLETION_REWARD;
        return result;
    } catch (error) {
        console.error("Error generating wish contract:", error);
        return { primaryObjective: `ERROR: Forge Your Own Path for "${description}"`, contractStatement: "Signal weak. Define your own terms for conquering this wish. Stay hard!", rewardPayout: WISH_COMPLETION_REWARD, kpis: [], preStateAnswers, fiveWhys };
    }
};
