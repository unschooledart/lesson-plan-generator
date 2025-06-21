// Copyright 2025 unschooled.art

// --- Google Sheets CSV URLs ---
const STANDARDS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=0&single=true&output=csv';
const QUESTIONS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=1354885292&single=true&output=csv';
const ACCOMMODATIONS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=421890709&single=true&output=csv';
const YOUTUBE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=2107013241&single=true&output=csv';

// --- Global Data Arrays ---
let allStandards = [];
let allEssentialQuestions = [];
let allAccommodations = [];
let allYouTubeChannels = [];

// --- Static Data ---
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


// --- MAIN EVENT LISTENER ---
document.addEventListener('DOMContentLoaded', () => {
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
    document.querySelector('.tab-link').click(); // Set default tab
    loadAllData(); // Start the application by loading all data
});


// --- DATA LOADING & PROCESSING ---

function loadDataFromSheet(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            skipEmptyLines: true,
            complete: (results) => {
                const [headers, ...dataRows] = results.data;
                const processed = dataRows.map(row => {
                    let obj = {};
                    headers.forEach((h, i) => {
                        const key = h.trim(); // Use the exact header name
                        const val = (row[i] || '').trim();
                        // Special handling for columns that should be arrays
                        if (key === 'grade_levels' || key === 'artistic_process') {
                            obj[key] = val.split(',').map(x => x.trim());
                        } else {
                            obj[key] = val;
                        }
                    });
                    return obj;
                });
                resolve(processed);
            },
            error: reject
        });
    });
}

async function loadAllData() {
    try {
        [allStandards, allEssentialQuestions, allAccommodations, allYouTubeChannels] = await Promise.all([
            loadDataFromSheet(STANDARDS_URL),
            loadDataFromSheet(QUESTIONS_URL),
            loadDataFromSheet(ACCOMMODATIONS_URL),
            loadDataFromSheet(YOUTUBE_URL)
        ]);
        initializeApp(); // Initialize the app AFTER all data is loaded
    } catch (error) {
        console.error("Error loading data:", error);
        alert("Error loading data from the database: " + error.message);
    }
}


// --- APP INITIALIZATION ---

function initializeApp() {
    // Populate dropdowns and checklists with both static and loaded data
    populateDropdown('gradeLevelSelect', gradeLevels);
    populateDropdown('disciplineSelect', disciplines);
    populateDropdown('artisticProcessSelect', artisticProcesses);
    populateChecklist('studioHabitsChecklist', studioHabits);
    populateDropdown('assessmentType', assessmentData, true);
    populateChecklist('accommodationsChecklist', allAccommodations.map(a => a.accommodation_text));

    // Run initial filters to populate dynamic dropdowns
    updateSpecificAssessments();
    filterEssentialQuestions();
    filterStandards();
    
    // Attach all event listeners to UI elements
    attachEventListeners();
}

function attachEventListeners() {
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

    // Wire up all AI buttons to the handler function
    document.querySelectorAll('.ai-button, .ai-button-inline').forEach(btn => {
        btn.addEventListener('click', handleAiButtonClick);
    });
}


// --- DYNAMIC UI FUNCTIONS (POPULATE & FILTER) ---

function populateDropdown(id, options, isSpecial = false) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '';
    if (isSpecial) {
        for (const [value, obj] of Object.entries(options)) {
            select.add(new Option(obj.name, value));
        }
    } else if (Array.isArray(options)) {
        options.forEach(txt => select.add(new Option(txt, txt)));
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
        if (q.question) {
            questionsDropdown.add(new Option(q.question, q.question));
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
            if (s.id && s.text) {
                dropdown.add(new Option(`${s.id} — ${s.text}`, s.id));
            }
        });
    } else {
        const option = new Option("No standards match criteria.", "");
        option.disabled = true;
        dropdown.add(option);
    }
}


// --- AI FUNCTIONALITY ---

async function handleAiButtonClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const formGroup = button.closest('.form-group');
    if (!formGroup) return;

    const targetElement = formGroup.querySelector('select, textarea, .checklist-container');
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

function getAiPrompt(targetId) {
    const lessonTitle = document.getElementById('lessonTitle').value || 'a visual arts lesson';
    const gradeSelect = document.getElementById('gradeLevelSelect');
    const grade = gradeSelect.options[gradeSelect.selectedIndex].text;
    const bigIdea = document.getElementById('bigIdea').value;
    const objectives = document.getElementById('lessonObjectives').value;
    const overview = document.getElementById('lessonOverview').value;
    const classSize = document.getElementById('classSizeSlider').value;
    
    const approvedChannels = allYouTubeChannels.map(c => c.channel_name).join(', ');

    const prompts = {
        essentialQuestionBank: `Generate 3-4 essential questions for a ${grade} art lesson titled "${lessonTitle}".`,
        lessonOverview: `Write a detailed lesson overview with a sequence of activities for a ${grade} art lesson titled "${lessonTitle}" about "${bigIdea}".`,
        lessonObjectives: `Write 3-4 clear, measurable lesson objectives for a ${grade} art lesson titled "${lessonTitle}". Start each objective with "Students will be able to...".`,
        lessonHook: `Generate a creative and engaging "lesson hook" or anticipatory set for a ${grade} art lesson about "${bigIdea}".`,
        vocabularyTerms: `List 5-7 key vocabulary terms with simple, student-friendly definitions for an art lesson about "${bigIdea}". Format as TERM: Definition.`,
        materialsList: `Based on the lesson overview "${overview}", generate a bulleted list of necessary art materials for a class of ${classSize} students.`,
        studioHabitsChecklist: `Based on the lesson overview "${overview}", which 2-3 of the following Studio Habits of Mind are most relevant? List only the names, separated by commas: ${studioHabits.join(', ')}.`,
        rubricCriteria: `Based on the lesson objectives "${objectives}", generate 3-4 specific rubric criteria for assessing student work at a proficient level.`,
        artHistoryConnections: `For an art lesson on "${bigIdea}", suggest 3 relevant artists or art movements. For each, provide a one-sentence summary of the connection.`,
        youtubeResources: `Suggest 3-4 age-appropriate videos for a ${grade} lesson on "${bigIdea}". IMPORTANT: Only suggest videos from the following specific YouTube channels: ${approvedChannels}.`
    };
    return prompts[targetId] || null;
}