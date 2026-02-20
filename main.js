/**
 * Rebirth – Kids AI Mentor MVP Logic
 */

const stories = [
    {
        theme: "Sharing",
        story: "Max had two cookies. His friend had none. Max shared one cookie and they both smiled.",
        task: "Today, try sharing one small thing with someone."
    },
    {
        theme: "Kind Words",
        story: "Lily saw her friend feeling sad. She said, 'You’re really good at drawing.' Her friend felt better.",
        task: "Today, say one kind thing to someone."
    },
    {
        theme: "Helping",
        story: "Tom saw toys on the floor. He helped clean up, and the room became nice and tidy.",
        task: "Today, help someone with a small task."
    },
    {
        theme: "Patience",
        story: "Mia wanted to play first. She waited for her turn, and everyone had fun.",
        task: "Today, practice waiting your turn once."
    },
    {
        theme: "Thankfulness",
        story: "Ben said 'thank you' when his mom helped him. His mom smiled.",
        task: "Today, say thank you to someone who helps you."
    }
];

let currentStory = null;

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const SYSTEM_PROMPT = `You are a kind, supportive mentor for children aged 5–10.
Use simple, encouraging language in 1–2 short sentences.
Match your tone to the emotion:
Happy → celebrate and encourage
Sad → comfort and reassure
Angry → calm and grounding
Confused → gentle clarity and support
Do not analyze, label, diagnose, or judge the child.
Do not give medical, psychological, or parenting advice.`;

/**
 * Helper to call Groq API
 */
async function callGroq(userPrompt, fallback) {
    try {
        if (!GROQ_API_KEY) {
            console.warn('Groq API Key missing');
            return fallback;
        }

        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Groq Error:', error);
        return fallback;
    }
}

/**
 * Generates a short, friendly greeting.
 */
async function getAIGreeting() {
    const defaultGreeting = "Hey dude, how was the day? Click anywhere to start!";
    return await callGroq("Generate one short, friendly greeting for a child named dude (1 sentence).", defaultGreeting);
}

/**
 * Generates an empathetic response based on emotion and theme.
 */
async function getAIResponse(emotion, theme) {
    const defaultResponse = "It's okay to feel that way. You're doing great. Let's try today's task together.";
    return await callGroq(`The child selected the emotion: ${emotion}. The story theme is: ${theme}. Respond with a short supportive message following the system rules.`, defaultResponse);
}

/**
 * Text-to-Speech wrapper to make Rebirth "talk".
 * Returns a Promise that resolves when speaking finishes.
 * @param {string} text - The text to speak
 */
function speak(text) {
    return new Promise((resolve) => {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 1.2;
            utterance.rate = 1.0;

            utterance.onend = () => {
                resolve();
            };

            // Safety timeout in case onend never fires
            setTimeout(resolve, 10000);

            window.speechSynthesis.speak(utterance);
        } else {
            resolve();
        }
    });
}

function init() {
    const storyText = document.getElementById('story-text');
    const welcomeAction = document.getElementById('welcome-action');
    const readyBtn = document.getElementById('ready-btn');
    const emotionContainer = document.getElementById('emotion-buttons');
    const emotionGrid = document.querySelector('.emotion-grid');
    const taskCard = document.getElementById('task-card');
    const taskText = document.getElementById('task-text');
    const mainContent = document.getElementById('main-content');
    const rewardOverlay = document.getElementById('reward-overlay');
    const completeBtn = document.getElementById('complete-btn');
    const rewardMsg = document.getElementById('reward-msg');
    const bgMusic = document.getElementById('bg-music');
    const angerBtn = document.getElementById('anger-capsule-btn');
    const breathingContainer = document.getElementById('breathing-exercise');
    const balloon = document.getElementById('breathing-balloon');
    const breathingInstruction = document.getElementById('breathing-instruction');
    const feelBetterBtn = document.getElementById('feel-better-btn');

    let previousUIState = null;

    // Set music volume
    if (bgMusic) {
        bgMusic.volume = 0.15; // Set to a smaller volume as requested
    }

    // Reset UI
    function resetUI() {
        welcomeAction.classList.add('hidden');
        emotionContainer.classList.add('hidden');
        taskCard.classList.add('hidden');
        rewardOverlay.classList.add('hidden');
        breathingContainer.classList.add('hidden');
        mainContent.classList.remove('blurred');
        completeBtn.disabled = false;
        completeBtn.classList.remove('hidden');
    }

    async function startBreathingExercise() {
        // Save state
        previousUIState = {
            stage,
            welcomeHidden: welcomeAction.classList.contains('hidden'),
            emotionHidden: emotionContainer.classList.contains('hidden'),
            taskCardHidden: taskCard.classList.contains('hidden'),
            storyText: storyText.textContent
        };

        // Hide current UI
        welcomeAction.classList.add('hidden');
        emotionContainer.classList.add('hidden');
        taskCard.classList.add('hidden');
        feelBetterBtn.classList.add('hidden');
        breathingContainer.classList.remove('hidden');

        const introMsg = "Let's do a breathing exercise together.";
        storyText.textContent = introMsg;
        await speak(introMsg);

        // Breathing cycles
        let cycles = 0;
        const totalCycles = 3;

        async function breathe() {
            if (cycles >= totalCycles) {
                breathingInstruction.textContent = "Great job!";
                feelBetterBtn.classList.remove('hidden');
                speak("You did great! How do you feel now?");
                return;
            }

            // Inhale
            breathingInstruction.textContent = "Breathe in...";
            balloon.className = 'balloon balloon-inhale';
            await new Promise(r => setTimeout(r, 3000));

            // Exhale
            breathingInstruction.textContent = "Breathe out...";
            balloon.className = 'balloon balloon-exhale';
            await new Promise(r => setTimeout(r, 3000));

            cycles++;
            breathe();
        }

        breathe();
    }

    feelBetterBtn.addEventListener('click', () => {
        breathingContainer.classList.add('hidden');

        // Restore state
        if (previousUIState) {
            stage = previousUIState.stage;
            if (!previousUIState.welcomeHidden) welcomeAction.classList.remove('hidden');
            if (!previousUIState.emotionHidden) emotionContainer.classList.remove('hidden');
            if (!previousUIState.taskCardHidden) taskCard.classList.remove('hidden');
            storyText.textContent = previousUIState.storyText;
        }

        speak("I'm glad you feel better! Let's continue.");
    });

    // Handle anger button click
    angerBtn.addEventListener('click', () => {
        startBreathingExercise();
    });

    // Pick a random story
    function loadRandomStory() {
        currentStory = stories[Math.floor(Math.random() * stories.length)];
        const text = currentStory.story;
        storyText.textContent = text;
        storyText.classList.remove('fade-in');
        void storyText.offsetWidth; // Trigger reflow
        storyText.classList.add('fade-in');

        speak(text);

        welcomeAction.classList.add('hidden');
        emotionContainer.classList.remove('hidden');
        taskCard.classList.add('hidden');
    }

    // Initial click-to-start logic
    let stage = 0; // 0: Greeting, 1: Ready Check, 2: Story

    function handleGlobalClick() {
        if (stage === 0) {
            stage = 1;
            document.removeEventListener('click', handleGlobalClick);

            // Play music on first interaction
            if (bgMusic && bgMusic.paused) {
                bgMusic.play().catch(e => console.warn('Music playback failed:', e));
            }

            const msg = "Are you ready for a small story?";
            storyText.textContent = msg;
            storyText.classList.remove('fade-in');
            void storyText.offsetWidth;
            storyText.classList.add('fade-in');

            speak(msg);

            welcomeAction.classList.remove('hidden');
        }
    }

    readyBtn.addEventListener('click', (e) => {
        console.log('Ready button clicked');
        e.stopPropagation(); // Avoid triggering global click if re-added
        stage = 2;
        loadRandomStory();
    });

    // Handle emotion clicks
    emotionGrid.addEventListener('click', async (e) => {
        const btn = e.target.closest('.emotion-btn');
        if (!btn) return;

        const emotion = btn.dataset.emotion;

        // Show loading state or text? 
        storyText.textContent = "...";

        const msg = await getAIResponse(emotion, currentStory.theme);

        // Update dialog
        storyText.textContent = msg;
        await speak(msg); // Wait for the supportive response to finish

        // Switch to task card
        emotionContainer.classList.add('hidden');
        taskCard.classList.remove('hidden');
        taskText.textContent = currentStory.task;

        // Narrate the mission ONLY after the first part is done
        speak("Your mission is: " + currentStory.task);
    });

    // Handle complete task button
    completeBtn.addEventListener('click', () => {
        completeBtn.disabled = true;
        completeBtn.classList.add('hidden');

        mainContent.classList.add('blurred');
        rewardOverlay.classList.remove('hidden');

        const successMsg = rewardMsg.textContent;
        speak(successMsg);

        console.log('Task completed, reward overlay shown!');
    });

    // Handle dismissing reward
    rewardOverlay.addEventListener('click', () => {
        rewardOverlay.classList.add('hidden');
        mainContent.classList.remove('blurred');

        // Hide the mission card so it's only avatar and text box
        taskCard.classList.add('hidden');

        const goodbyeMsg = "Good work today! See you tomorrow!";
        storyText.textContent = goodbyeMsg;
        speak(goodbyeMsg);
    });

    // Start with welcome message and wait for click
    resetUI();

    // FETCH AI GREETING
    getAIGreeting().then(greeting => {
        if (greeting) {
            storyText.textContent = greeting;
        }
    });

    document.addEventListener('click', () => {
        if (stage === 0) {
            // Play music on first interaction
            if (bgMusic) {
                bgMusic.play().catch(e => console.warn('Music playback failed:', e));
            }
            speak(storyText.textContent);
            handleGlobalClick();
        }
    }, { once: true });
}

document.addEventListener('DOMContentLoaded', init);
