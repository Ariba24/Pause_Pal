let timer;
let timeRemaining = 1500;
let breaksTaken = 0;
let userPreferences = [];
let customBreak = "";
let customMessage = "";
let timerStarted = false;

let notes = JSON.parse(localStorage.getItem("pausepal_notes")) || [];
let editingNoteId = null;

document.addEventListener("DOMContentLoaded", () => {
  updateTimerDisplay();
  renderNotes();
});

// Theme Toggle
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

// Navigation
function goToScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

// Save Break Settings
function saveSettings() {
  const interval = parseInt(document.getElementById("interval").value) || 25;
  timeRemaining = interval * 60;
  updateTimerDisplay();

  userPreferences = [];
  document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
    if (cb.checked) userPreferences.push(cb.value);
  });

  customBreak = document.getElementById("custom-break").value.trim();
  customMessage = document.getElementById("custom-message").value.trim();

  if (customBreak && customMessage) {
    userPreferences.push(customBreak);
  }

  if (userPreferences.length === 0) {
    alert("Please select at least one break or add a custom one.");
    return;
  }

  goToScreen("home-screen");
  timerStarted = false;
  updateTimerDisplay();
}

// Timer Logic
function updateTimerDisplay() {
  const min = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
  const sec = (timeRemaining % 60).toString().padStart(2, '0');
  document.getElementById("timer").textContent = `${min}:${sec}`;
}

function startTimer() {
  if (timerStarted) return;
  timerStarted = true;
  clearInterval(timer);
  timer = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    if (timeRemaining <= 0) {
      clearInterval(timer);
      showBreakReminder();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  timerStarted = false;
}

function resetTimer() {
  clearInterval(timer);
  timerStarted = false;
  const interval = parseInt(document.getElementById("interval").value) || 25;
  timeRemaining = interval * 60;
  updateTimerDisplay();
}

// Break Message
function showBreakReminder() {
  const messages = {
    "Drink Water": "💧 Drink some water and smile 😊",
    "Stretch": "🤸 Stretch it out! Your body will thank you.",
    "Breathe": "🧘 Take a deep breath. You've earned it.",
    "Look Away": "👀 Look away from your screen. Reset your focus."
  };

  let finalMessages = [];

  userPreferences.forEach(pref => {
    if (pref === customBreak && customMessage) {
      finalMessages.push("📝 " + customMessage);
    } else if (messages[pref]) {
      finalMessages.push(messages[pref]);
    }
  });

  const fullMessage = finalMessages.length > 0 ? finalMessages.join("\n") : "Time for a short break!";
  document.getElementById("quote").textContent = fullMessage;

  addBreakToLog();
  goToScreen("reminder-screen");
}

function dismissReminder() {
  resetTimer();
  goToScreen("home-screen");
}

function snoozeReminder() {
  clearInterval(timer);
  timeRemaining = 5 * 60;
  updateTimerDisplay();
  startTimer();
  goToScreen("home-screen");
}

// Stats Tracking
function addBreakToLog() {
  breaksTaken++;
  document.getElementById("break-count").textContent = breaksTaken;
  const li = document.createElement("li");
  li.textContent = `Break at ${new Date().toLocaleTimeString()}`;
  document.getElementById("break-log").appendChild(li);
  updateProgress();
}

function updateProgress() {
  const progress = Math.min(breaksTaken * 10, 100);
  document.getElementById("progress-bar").style.width = `${progress}%`;
}

// ============ Notes App Logic ============

function openNewNoteModal() {
  editingNoteId = null;
  document.getElementById("note-title").value = "";
  document.getElementById("note-content").value = "";
  document.getElementById("image-preview").innerHTML = "";
  document.getElementById("note-editor").style.display = "flex";
  document.getElementById("note-editor").dataset.locked = "false";
}

function closeEditor() {
  document.getElementById("note-editor").style.display = "none";
}

function saveNote() {
  const title = document.getElementById("note-title").value;
  const content = document.getElementById("note-content").value;
  const images = Array.from(document.querySelectorAll("#image-preview img")).map(img => img.src);
  const locked = document.getElementById("note-editor").dataset.locked === "true";
  const password = locked ? prompt("Set a password for this note:") : null;

  const note = {
    id: editingNoteId || Date.now(),
    title,
    content,
    images,
    locked,
    password
  };

  if (editingNoteId) {
    notes = notes.map(n => n.id === editingNoteId ? note : n);
  } else {
    notes.push(note);
  }

  localStorage.setItem("pausepal_notes", JSON.stringify(notes));
  renderNotes();
  closeEditor();
}

function deleteNote(id) {
  if (confirm("Are you sure you want to delete this note?")) {
    notes = notes.filter(note => note.id !== id);
    localStorage.setItem("pausepal_notes", JSON.stringify(notes));
    renderNotes();
    closeEditor();
  }
}

function deleteCurrentNote() {
  if (!editingNoteId) return;
  deleteNote(editingNoteId);
}

function renderNotes() {
  const list = document.getElementById("notes-list");
  list.innerHTML = "";
  notes.forEach(note => {
    const div = document.createElement("div");
    div.className = "note-card";
    div.innerHTML = `
      <h4>${note.title}</h4>
      <p>${note.locked ? '🔒 Locked' : note.content.substring(0, 100)}</p>
      <button onclick="deleteNote(${note.id}); event.stopPropagation();">🗑 Delete</button>
    `;
    div.onclick = () => {
      if (note.locked) {
        const input = prompt("This note is locked. Enter password:");
        if (input !== note.password) {
          alert("Incorrect password");
          return;
        }
      }
      editNote(note.id);
    };
    list.appendChild(div);
  });
}

function editNote(id) {
  const note = notes.find(n => n.id === id);
  editingNoteId = id;
  document.getElementById("note-title").value = note.title;
  document.getElementById("note-content").value = note.content;
  document.getElementById("image-preview").innerHTML = note.images.map(src => `<img src="${src}" />`).join("");
  document.getElementById("note-editor").dataset.locked = note.locked;
  document.getElementById("note-editor").style.display = "flex";
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = document.createElement("img");
    img.src = e.target.result;
    document.getElementById("image-preview").appendChild(img);
  };
  reader.readAsDataURL(file);
}

function toggleChecklist() {
  const content = document.getElementById("note-content").value;
  const lines = content.split("\n").map(line => `☐ ${line}`);
  document.getElementById("note-content").value = lines.join("\n");
}

function applyTemplate() {
  const templates = [
    { name: "Checklist", content: "☐ Item 1\n☐ Item 2" },
    { name: "Journal", content: "Today I feel...\n\nWhat I learned today..." },
    { name: "Study Notes", content: "Topic: \n- Point 1\n- Point 2" },
    { name: "Gratitude Log", content: "I am thankful for...\n1. \n2. \n3." }
  ];
  const choice = prompt("Choose template: checklist, journal, study, gratitude").toLowerCase();
  const template = templates.find(t => t.name.toLowerCase().includes(choice));
  if (template) document.getElementById("note-content").value = template.content;
}

function changeWallpaper() {
  const color = prompt("Enter background color (e.g. #fefefe or blue):");
  document.querySelector(".modal-content").style.background = color;
}

function lockNote() {
  const currentLock = document.getElementById("note-editor").dataset.locked === "true";
  document.getElementById("note-editor").dataset.locked = currentLock ? "false" : "true";
  alert(currentLock ? "Note unlocked." : "Note will be locked on save.");
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const title = document.getElementById("note-title").value;
  const content = document.getElementById("note-content").value;
  doc.text(title, 10, 10);
  doc.text(content, 10, 20);
  doc.save(`${title}.pdf`);
}

function shareNote() {
  const content = document.getElementById("note-content").value;
  navigator.clipboard.writeText(content);
  alert("Note copied to clipboard! Paste it anywhere.");
}
document.getElementById("product-info-btn").addEventListener("click", function () {
  showScreen("product-info-screen");
});

function submitFeedback(e) {
  e.preventDefault();
  alert("Thank you for your feedback! We'll get back to you soon.");
  document.getElementById("feedback-form").reset();
}
