// Copyright 2025 unschooled.art

// --- Google Sheets CSV URLs ---
const STANDARDS_URL       = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=0&single=true&output=csv';
const QUESTIONS_URL       = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=1354885292&single=true&output=csv';
const ACCOMMODATIONS_URL  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=421890709&single=true&output=csv';
const YOUTUBE_URL         = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=2107013241&single=true&output=csv';

let allStandards = [], allEssentialQuestions = [], allAccommodations = [], allYouTubeChannels = [];

// --- Static Data Objects ---
const gradeLevels = {
  pre_k: "Pre-K",
  kindergarten: "Kindergarten",
  "1st": "1st Grade",
  "2nd": "2nd Grade",
  "3rd": "3rd Grade",
  "4th": "4th Grade",
  "5th": "5th Grade",
  "6th": "6th Grade",
  "7th": "7th Grade",
  "8th": "8th Grade",
  hs_proficient: "High School Proficient",
  hs_accomplished: "High School Accomplished",
  hs_advanced: "High School Advanced"
};

const disciplines = {
  visual_arts: "Visual Arts",
  media_arts: "Media Arts"
};

const artisticProcesses = {
  creating: "Creating",
  presenting: "Presenting",
  responding: "Responding",
  connecting: "Connecting"
};

const assessmentData = {
  formative: {
    name: "Formative",
    activities: ["Exit Ticket", "Peer Critique", "Sketchbook Check", "Think-Pair-Share"]
  },
  summative: {
    name: "Summative",
    activities: ["Final Project", "Portfolio Review", "Rubric-based Assessment", "Artist Statement"]
  }
};

const lessonObjectives = [
  "Students will be able to identify and apply primary colors in a painting.",
  "Students will create a self-portrait using proportions and shading techniques.",
  "Students will analyze and interpret an artwork based on the elements of art."
];

const studioHabits = [
  "Develop Craft",
  "Engage & Persist",
  "Envision",
  "Express",
  "Observe",
  "Reflect",
  "Stretch & Explore",
  "Understand Art Worlds"
];

// --- Utility Functions ---
function populateDropdown(id, items, includeWriteOwn = false) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = '';
  items.forEach(it => {
    const o = document.createElement('option');
    o.value = it;
    o.textContent = it;
    sel.appendChild(o);
  });
  if (includeWriteOwn) {
    const o = document.createElement('option');
    o.value = 'write_my_own';
    o.textContent = 'Write My Own';
    sel.appendChild(o);
  }
}

function handleWriteMyOwn(selectId, textareaId) {
  const sel = document.getElementById(selectId);
  const ta  = document.getElementById(textareaId);
  if (!sel || !ta) return;
  sel.addEventListener('change', () => {
    ta.classList.toggle('hidden', sel.value !== 'write_my_own');
  });
}

function populateChecklist(id, items) {
  const div = document.getElementById(id);
  if (!div) return;
  div.innerHTML = '';
  items.forEach(txt => {
    const label = document.createElement('label');
    label.className = 'checklist-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = txt;
    cb.checked = true;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(` ${txt}`));
    div.appendChild(label);
  });
}

function updateAssessmentActivities() {
  const type = document.getElementById('assessmentType').value;
  const acts = assessmentData[type]?.activities || [];
  populateDropdown('specificAssessmentActivity', acts, true);
}

function updateSuppliesFromOverview() {
  const overview = document.getElementById('lessonOverview').value;
  const out = document.getElementById('supplyList');
  if (!out) return;
  out.value = `Generating supplies for 25 students based on: "${overview}"\n• Paper x 25\n• Brushes x 25\n• Paint sets x 25\n• Water cups x 25`;
}

function scaleSuppliesByClassSize() {
  const slider = document.getElementById('classSizeSlider');
  const out    = document.getElementById('supplyList');
  const span   = document.getElementById('classSizeValue');
  if (!slider || !out || !span) return;
  const n = parseInt(slider.value, 10);
  span.textContent = n;
  out.value = out.value.replace(/x \d+/g, `x ${n}`);
}

function addRubricCriterion() {
  const list = document.getElementById('rubricCriteriaList');
  const val  = document.getElementById('rubricInput').value.trim();
  if (!val) return;
  const li = document.createElement('li');
  li.textContent = val;
  list.appendChild(li);
  document.getElementById('rubricInput').value = '';
}

function getGeneralGradeLevel(code) {
  const el = ["pre_k","kindergarten","1st","2nd","3rd","4th","5th"];
  const md = ["6th","7th","8th"];
  const hi = ["hs_proficient","hs_accomplished","hs_advanced"];
  if (el.includes(code)) return "elementary";
  if (md.includes(code)) return "middle_school";
  if (hi.includes(code)) return "high_school";
  return "";
}

// --- Filtering Functions ---
function filterStandards() {
  const grade      = document.getElementById('gradeLevelSelect').value;
  const discipline = document.getElementById('disciplineSelect').value;
  const process    = document.getElementById('artisticProcessSelect').value;
  const sel        = document.getElementById('standardsSelect');
  sel.innerHTML = '';

  allStandards
    .filter(s =>
      Array.isArray(s.grade_levels) &&
      s.grade_levels.includes(grade) &&
      s.discipline === discipline &&
      s.process === process
    )
    .forEach(s => {
      const o = document.createElement('option');
      o.value = s.text;
      o.textContent = `${s.anchor_std_code.toUpperCase()} — ${s.text}`;
      sel.appendChild(o);
    });

  const own = document.createElement('option');
  own.value = 'write_my_own';
  own.textContent = 'Write My Own';
  sel.appendChild(own);
}

function filterEssentialQuestions() {
  const process = document.getElementById('artisticProcessSelect').value;
  const sel     = document.getElementById('essentialQuestionBank');
  sel.innerHTML = '';

  allEssentialQuestions
    .filter(q => Array.isArray(q.artistic_process) && q.artistic_process.includes(process))
    .forEach(q => {
      const o = document.createElement('option');
      o.value = q.question;
      o.textContent = q.question;
      sel.appendChild(o);
    });

  const own = document.createElement('option');
  own.value = 'write_my_own';
  own.textContent = 'Write My Own';
  sel.appendChild(own);
}

function filterYouTubeChannels() {
  const grade = document.getElementById('gradeLevelSelect').value;
  const lvl   = getGeneralGradeLevel(grade);
  const out   = document.getElementById('youtubeResources');
  out.value = allYouTubeChannels
    .filter(c => c.grade_levels.includes(lvl) || c.grade_levels.includes('all_levels'))
    .slice(0,3)
    .map(c => `• ${c.channel_name}: ${c.link}`)
    .join('\n');
}

// --- CSV Loader (preserve question/text case) ---
function loadDataFromSheet(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: rs => {
        const data = rs.data.map(row => {
          const o = {};
          Object.entries(row).forEach(([k,v]) => {
            const key = k.trim().toLowerCase();
            const val = v.trim();
            if (key === 'grade_levels' || key === 'artistic_process') {
              o[key] = val.toLowerCase().split(',').map(x => x.trim());
            } else if (key === 'discipline' || key === 'process') {
              o[key] = val.toLowerCase();
            } else {
              o[key] = val;  // preserve original case for question, text, etc.
            }
          });
          return o;
        });
        resolve(data);
      },
      error: reject
    });
  });
}

// --- Initialize App ---
async function initializeApp() {
  try {
    [allStandards, allEssentialQuestions, allAccommodations, allYouTubeChannels] = await Promise.all([
      loadDataFromSheet(STANDARDS_URL),
      loadDataFromSheet(QUESTIONS_URL),
      loadDataFromSheet(ACCOMMODATIONS_URL),
      loadDataFromSheet(YOUTUBE_URL)
    ]);

    // --- Grade Level (prettified) ---
    const gradeSelect = document.getElementById('gradeLevelSelect');
    gradeSelect.innerHTML = '';
    Object.entries(gradeLevels).forEach(([value, label]) => {
      gradeSelect.add(new Option(label, value));
    });

    // --- Discipline (prettified) ---
    const discSelect = document.getElementById('disciplineSelect');
    discSelect.innerHTML = '';
    Object.entries(disciplines).forEach(([value, label]) => {
      discSelect.add(new Option(label, value));
    });

    // --- Artistic Process (prettified) ---
    const procSelect = document.getElementById('artisticProcessSelect');
    procSelect.innerHTML = '';
    Object.entries(artisticProcesses).forEach(([value, label]) => {
      procSelect.add(new Option(label, value));
    });

    // --- Lesson Objectives, Studio Habits, Assessment ---
    populateDropdown('lessonObjectivesSelect', lessonObjectives, true);
    populateChecklist('studioHabitsChecklist', studioHabits);

    // --- Assessment Type (prettified) ---
    const assessSelect = document.getElementById('assessmentType');
    assessSelect.innerHTML = '';
    Object.entries(assessmentData).forEach(([key, data]) => {
      assessSelect.add(new Option(data.name, key));
    });
    updateAssessmentActivities();

    populateDropdown(
      'accommodationsSelect',
      allAccommodations.map(a => a.accommodation_text),
      true
    );

    // --- Defaults & Events ---
    document.getElementById('classSizeSlider').value = 25;
    document.getElementById('classSizeValue').textContent = 25;
    document.getElementById('assessmentType')
      .addEventListener('change', updateAssessmentActivities);
    document.getElementById('lessonOverview')
      .addEventListener('blur', updateSuppliesFromOverview);
    document.getElementById('classSizeSlider')
      .addEventListener('input', scaleSuppliesByClassSize);
    document.getElementById('addRubricBtn')
      .addEventListener('click', addRubricCriterion);
    document.getElementById('gradeLevelSelect')
      .addEventListener('change', () => {
        filterStandards();
        filterYouTubeChannels();
      });
    document.getElementById('disciplineSelect')
      .addEventListener('change', filterStandards);
    document.getElementById('artisticProcessSelect')
      .addEventListener('change', () => {
        filterStandards();
        filterEssentialQuestions();
      });

    handleWriteMyOwn('lessonObjectivesSelect','lessonObjectiveTextarea');
    handleWriteMyOwn('standardsSelect','customStandardTextarea');
    handleWriteMyOwn('essentialQuestionBank','customQuestionTextarea');
    handleWriteMyOwn('specificAssessmentActivity','customAssessmentTextarea');
    handleWriteMyOwn('accommodationsSelect','customAccommodationTextarea');

    filterStandards();
    filterEssentialQuestions();
    filterYouTubeChannels();
  } catch (err) {
    console.error('Data load failed:', err);
    alert('Error loading data. Please try again later.');
  }
}

// --- Tabs Setup ---
function setupTabs() {
  const links = document.querySelectorAll('.tab-link'),
        tabs  = document.querySelectorAll('.tab-content');
  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      tabs.forEach(t => t.style.display = 'none');
      links.forEach(l => l.classList.remove('active'));
      const id = link.getAttribute('data-tab');
      document.getElementById(id).style.display = 'block';
      link.classList.add('active');
    });
  });
}

// --- Kickoff ---
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  initializeApp();
});
