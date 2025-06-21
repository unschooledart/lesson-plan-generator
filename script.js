// Copyright 2025 unschooled.art
// This file handles the frontend logic and calls our secure backend function.

// This script assumes `database.js` has been loaded and has populated the following arrays:
// let allStandards = [];
// let allEssentialQuestions = [];
// let allAccommodations = [];
// let allYouTubeChannels = [];

// --- Data for elements not from the database file ---
const disciplines = { "visual_arts": "Visual Arts" };
const artisticProcesses = { "creating": "Creating", "presenting": "Presenting", "responding": "Responding", "connecting": "Connecting" };
const gradeLevels = {
    "pre_k": "Pre-K", "kindergarten": "Kindergarten", "1st": "1st Grade", "2nd": "2nd Grade",
    "3rd": "3rd Grade", "4th": "4th Grade", "5th": "5th Grade", "6th": "6th Grade",
    "7th": "7th Grade", "8th": "8th Grade", "hs_proficient": "High School Proficient",
    "hs_accomplished": "High School Accomplished", "hs_advanced": "High School Advanced"
};
const assessmentData = {
    "formative": { name: "Formative", activities: ["Exit Ticket", "Peer Critique", "Sketchbook Check", "Think-Pair-Share"] },
    "summative": { name: "Summative", activities: ["Final Project", "Portfolio Review", "Rubric-based Assessment", "Artist Statement"] }
};
const studioHabits = ["Develop Craft", "Engage & Persist", "Envision", "Express", "Observe", "Reflect", "Stretch & Explore", "Understand Art Worlds"];


// --- AI PROMPT GENERATION ---
function getAiPrompt(targetId) {
    const form = document.getElementById('lessonPlanForm');
    const lessonTitle = form.lessonTitle.value || 'a visual arts lesson';
    const grade = form.gradeLevelSelect.options[form.gradeLevelSelect.selectedIndex].text;
    const bigIdea = form.bigIdea.value;
    const objectives = form.lessonObjectives.value;
    const overview = form.lessonOverview.value;

    const prompts = {
        essentialQuestionBank: `Generate 3-4 essential questions for a ${grade} art lesson titled "${lessonTitle}".`,
        lessonOverview: `Write a lesson overview with a sequence of activities for a ${grade} art lesson titled "${lessonTitle}" about "${bigIdea}".`,
        lessonObjectives: `Write 3-4 clear lesson objectives for a ${grade} art lesson titled "${lessonTitle}". Start each objective with "Students will be able to...".`,
        lessonHook: `Generate a creative and engaging "lesson hook" or opener for a ${grade} art lesson about "${bigIdea}".`,
        vocabularyTerms: `List 5-7 key vocabulary terms with simple, student-friendly definitions for an art lesson about "${bigIdea}". Format as TERM: Definition.`,
        materialsList: `Based on the lesson overview "${overview}", generate a bulleted list of necessary art materials for a class of ${form.classSizeSlider.value} students.`,
        studioHabitsChecklist: `Based on the lesson overview "${overview}", which 2-3 of the following Studio Habits of Mind are most relevant? List only the names, separated by commas: ${studioHabits.join(', ')}.`,
        rubricCriteria: `Based on the lesson objectives "${objectives}", generate 3-4 specific rubric criteria for assessing student work at a proficient level.`,
        artHistoryConnections: `For an art lesson on "${bigIdea}", suggest 3 relevant artists or art movements. For each, provide a one-sentence summary of the connection.`,
        youtubeResources: `Suggest 3-4 age-appropriate videos for a ${grade} lesson on "${bigIdea}". IMPORTANT: Only suggest videos from the following specific YouTube channels: Art for Kids Hub, The Art Assignment, Smarthistory, unschooled_art, Art with Mati & Dada, Art Insider, #Metkids, Ted-Ed, PBS Kids, Proko, Bob Ross.`
    };
    return prompts[targetId] || null;
}

async function handleAiButtonClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    let formGroup = button.closest('.form-group');
    if (!formGroup) return;

    // For inline buttons, the target is the associated control in the same form group
    let targetElement = formGroup.querySelector('select, textarea, .checklist-container');
    if (!targetElement) return;

    const targetId = targetElement.id;

    const prompt = getAiPrompt(targetId);
    if (!prompt) {
        alert("Sorry, an AI prompt could not be generated for this feature.");
        return;
    }

    button.disabled = true;
    const originalButtonText = button.innerHTML;
    button.textContent = 'Generating...';

    try {
        const response = await fetch('/.netlify/functions/generateAiContent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (targetId === 'studioHabitsChecklist') {
            const habits = data.reply.split(',').map(h => h.trim());
            document.querySelectorAll(`#${targetId} input[type="checkbox"]`).forEach(checkbox => {
                checkbox.checked = habits.includes(checkbox.value);
            });
        } else {
            targetElement.value = data.reply;
        }

    } catch (error) {
        console.error("Error calling AI function:", error);
        alert(`An error occurred: ${error.message}`);
    } finally {
        button.disabled = false;
        button.innerHTML = originalButtonText;
    }
}


// --- App Initialization and DOM Manipulation ---
document.addEventListener('DOMContentLoaded', () => {
    function initializeApp() {
        populateDropdown('gradeLevelSelect', gradeLevels);
        populateDropdown('disciplineSelect', disciplines);
        populateDropdown('artisticProcessSelect', artisticProcesses);
        populateChecklist('studioHabitsChecklist', studioHabits);
        populateDropdown('assessmentType', assessmentData, true);
        populateChecklist('accommodationsChecklist', allAccommodations.map(a => a.accommodation_text));
        
        updateSpecificAssessments();
        filterEssentialQuestions();
        filterStandards();

        document.getElementById('disciplineSelect').addEventListener('change', filterStandards);
        document.getElementById('gradeLevelSelect').addEventListener('change', filterStandards);
        document.getElementById('artisticProcessSelect').addEventListener('change', () => {
            filterStandards();
            filterEssentialQuestions();
        });
        document.getElementById('assessmentType').addEventListener('change', updateSpecificAssessments);
        
        const slider = document.getElementById('classSizeSlider');
        const sliderValue = document.getElementById('classSizeValue');
        if (slider && sliderValue) {
            slider.addEventListener('input', (e) => sliderValue.textContent = e.target.value);
        }
        
        document.querySelectorAll('.ai-button, .ai-button-inline').forEach(btn => {
            btn.addEventListener('click', handleAiButtonClick);
        });
    }
    
    // Make openTab globally accessible
    window.openTab = (event, tabName) => {
        document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
        document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
        document.getElementById(tabName).style.display = 'block';
        event.currentTarget.classList.add('active');
    };

    document.querySelectorAll('.tab-link').forEach(link => {
        link.addEventListener('click', (event) => {
            const tabName = link.getAttribute('onclick').split("'")[1];
            window.openTab(event, tabName);
        });
    });

    document.querySelector('.tab-link').click();
    initializeApp();
});


// --- Helper Functions (assuming `database.js` provides the data arrays) ---
function populateDropdown(id, options, isSpecial = false) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '';
    if (isSpecial) {
        for (const [value, obj] of Object.entries(options)) {
            select.add(new Option(obj.name, value));
        }
    } else if (Array.isArray(options)) {
        options.forEach(txt => select.add(new Option(txt, txt.toLowerCase().replace(/ /g, '_'))));
    } else {
        for (const [val, label] of Object.entries(options)) {
            select.add(new Option(label, val));
        }
    }
}

function populateChecklist(id, items) {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
        if (!item) return;
        const label = document.createElement('label');
        label.className = 'checklist-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = item;
        checkbox.name = id;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${item}`));
        container.appendChild(label);
    });
}

function updateSpecificAssessments() {
    const type = document.getElementById('assessmentType').value;
    const activities = assessmentData[type]?.activities || [];
    populateDropdown('specificAssessmentActivity', activities);
}

function filterEssentialQuestions() {
    const questionsDropdown = document.getElementById('essentialQuestionBank');
    if (!questionsDropdown) return;
    questionsDropdown.innerHTML = '';
    const selectedProcess = document.getElementById('artisticProcessSelect').value;
    const filtered = allEssentialQuestions.filter(q =>
        q && Array.isArray(q.artistic_process) && q.artistic_process.includes(selectedProcess)
    );
    filtered.forEach(q => {
        if(q.question) {
            const option = document.createElement('option');
            option.textContent = q.question;
            option.value = q.question;
            questionsDropdown.appendChild(option);
        }
    });
}

function filterStandards() {
    const dropdown = document.getElementById('standardsSelect');
    if (!dropdown) return;
    dropdown.innerHTML = '';

    const discipline = document.getElementById('disciplineSelect').value;
    const grade = document.getElementById('gradeLevelSelect').value;
    const process = document.getElementById('artisticProcessSelect').value;

    const filtered = allStandards.filter(s =>
        s && s.discipline === discipline &&
        s.process === process &&
        Array.isArray(s.grade_levels) &&
        s.grade_levels.includes(grade)
    );

    if (filtered.length > 0) {
        filtered.forEach(s => {
            const code = s.anchor_std_code?.toUpperCase() || '[No Code]';
            const text = s.text || '[No Description]';
            const label = `${s.id} — ${text}`;
            const option = document.createElement('option');
            option.textContent = label;
            option.value = s.id;
            dropdown.appendChild(option);
        });
    } else {
        const option = new Option("No standards match criteria.", "");
        option.disabled = true;
        dropdown.add(option);
    }
}