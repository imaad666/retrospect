// Retro$pect - Sticky Notes App (2000s Style!)
// No fancy frameworks, just pure vanilla JS like the good old days

// Global state
let notes = [];
let selectedColor = 'yellow';
let draggedNote = null;
let offsetX = 0;
let offsetY = 0;

// Load notes from localStorage on page load
window.addEventListener('DOMContentLoaded', function() {
    loadNotes();
    updateStats();
    setupEventListeners();
    updateLastLogin();
});

// Setup all event listeners
function setupEventListeners() {
    // Quick note form submission
    const quickForm = document.getElementById('quickNoteForm');
    if (quickForm) {
        quickForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addNote();
        });
    }

    // Color picker buttons
    const colorButtons = document.querySelectorAll('.color-btn');
    colorButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            colorButtons.forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            selectedColor = this.getAttribute('data-color');
        });
    });

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterButtons.forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            filterNotes(filter);
        });
    });
}

// Add a new note
function addNote() {
    const title = document.getElementById('quickTitle').value.trim();
    const category = document.getElementById('quickCategory').value;
    const content = document.getElementById('quickContent').value.trim();

    if (!title || !content) {
        alert('Please fill in both title and content!');
        return;
    }

    const note = {
        id: Date.now(),
        title: title,
        category: category,
        content: content,
        color: selectedColor,
        date: new Date().toLocaleDateString(),
        position: getRandomPosition()
    };

    notes.push(note);
    saveNotes();
    renderNotes();
    updateStats();

    // Clear form
    document.getElementById('quickTitle').value = '';
    document.getElementById('quickContent').value = '';
}

// Get random position for new note
function getRandomPosition() {
    const board = document.getElementById('notesBoard');
    const boardRect = board.getBoundingClientRect();
    const maxX = boardRect.width - 220; // note width + padding
    const maxY = boardRect.height - 220; // note height + padding
    
    return {
        x: Math.max(20, Math.floor(Math.random() * maxX)),
        y: Math.max(20, Math.floor(Math.random() * maxY))
    };
}

// Render all notes
function renderNotes() {
    const board = document.getElementById('notesBoard');
    const emptyMessage = board.querySelector('.empty-message');
    
    if (notes.length === 0) {
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
        }
        return;
    }

    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }

    // Clear existing notes
    const existingNotes = board.querySelectorAll('.sticky-note');
    existingNotes.forEach(function(note) {
        note.remove();
    });

    // Render each note
    notes.forEach(function(note) {
        const noteElement = createNoteElement(note);
        board.appendChild(noteElement);
    });
}

// Create a note element
function createNoteElement(note) {
    const div = document.createElement('div');
    div.className = 'sticky-note ' + note.color;
    div.setAttribute('data-id', note.id);
    div.style.left = note.position.x + 'px';
    div.style.top = note.position.y + 'px';

    const categoryEmoji = {
        'note': '📌',
        'wish': '🌟',
        'memory': '💭',
        'goal': '🎯'
    };

    div.innerHTML = `
        <div class="note-header">
            <div class="note-title">${escapeHtml(note.title)}</div>
            <div class="note-category">${categoryEmoji[note.category] || '📌'} ${note.category}</div>
        </div>
        <div class="note-content">${escapeHtml(note.content)}</div>
        <div class="note-footer">
            <span class="note-date">${note.date}</span>
            <button class="btn-delete" onclick="deleteNote(${note.id})">✕ Delete</button>
        </div>
    `;

    // Make note draggable
    div.addEventListener('mousedown', startDrag);

    return div;
}

// Start dragging a note
function startDrag(e) {
    if (e.target.classList.contains('btn-delete')) {
        return; // Don't drag when clicking delete button
    }

    draggedNote = this;
    draggedNote.classList.add('dragging');

    const rect = draggedNote.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

// Drag the note
function drag(e) {
    if (!draggedNote) return;

    const board = document.getElementById('notesBoard');
    const boardRect = board.getBoundingClientRect();

    let newX = e.clientX - boardRect.left - offsetX;
    let newY = e.clientY - boardRect.top - offsetY;

    // Keep note within bounds
    newX = Math.max(0, Math.min(newX, boardRect.width - draggedNote.offsetWidth));
    newY = Math.max(0, Math.min(newY, boardRect.height - draggedNote.offsetHeight));

    draggedNote.style.left = newX + 'px';
    draggedNote.style.top = newY + 'px';
}

// Stop dragging
function stopDrag() {
    if (!draggedNote) return;

    draggedNote.classList.remove('dragging');

    // Save new position
    const noteId = parseInt(draggedNote.getAttribute('data-id'));
    const note = notes.find(function(n) {
        return n.id === noteId;
    });

    if (note) {
        note.position = {
            x: parseInt(draggedNote.style.left),
            y: parseInt(draggedNote.style.top)
        };
        saveNotes();
    }

    draggedNote = null;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
}

// Delete a note
function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }

    notes = notes.filter(function(note) {
        return note.id !== id;
    });

    saveNotes();
    renderNotes();
    updateStats();
}

// Filter notes by category
function filterNotes(filter) {
    const allNotes = document.querySelectorAll('.sticky-note');
    
    allNotes.forEach(function(noteElement) {
        const noteId = parseInt(noteElement.getAttribute('data-id'));
        const note = notes.find(function(n) {
            return n.id === noteId;
        });

        if (filter === 'all' || note.category === filter) {
            noteElement.style.display = 'block';
        } else {
            noteElement.style.display = 'none';
        }
    });
}

// Update statistics
function updateStats() {
    const totalElement = document.getElementById('totalNotes');
    const weekElement = document.getElementById('weekNotes');

    if (totalElement) {
        totalElement.textContent = notes.length;
    }

    // Calculate notes from this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekNotes = notes.filter(function(note) {
        const noteDate = new Date(note.date);
        return noteDate >= oneWeekAgo;
    }).length;

    if (weekElement) {
        weekElement.textContent = weekNotes;
    }
}

// Update last login time
function updateLastLogin() {
    const lastLoginElement = document.getElementById('lastLogin');
    if (lastLoginElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        lastLoginElement.textContent = 'Today ' + timeString;
    }
}

// Save notes to localStorage
function saveNotes() {
    try {
        localStorage.setItem('retrospect_notes', JSON.stringify(notes));
    } catch (e) {
        console.error('Error saving notes:', e);
    }
}

// Load notes from localStorage
function loadNotes() {
    try {
        const saved = localStorage.getItem('retrospect_notes');
        if (saved) {
            notes = JSON.parse(saved);
            renderNotes();
        }
    } catch (e) {
        console.error('Error loading notes:', e);
        notes = [];
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add some sample notes on first visit
if (!localStorage.getItem('retrospect_notes')) {
    notes = [
        {
            id: Date.now() - 3000,
            title: 'Welcome!',
            category: 'note',
            content: 'Welcome to retro$pect! This is your personal sticky notes board. Drag me around!',
            color: 'yellow',
            date: new Date().toLocaleDateString(),
            position: { x: 50, y: 50 }
        },
        {
            id: Date.now() - 2000,
            title: 'My First Wish',
            category: 'wish',
            content: 'I wish to travel the world and see amazing places!',
            color: 'pink',
            date: new Date().toLocaleDateString(),
            position: { x: 300, y: 100 }
        },
        {
            id: Date.now() - 1000,
            title: 'Remember This',
            category: 'memory',
            content: 'That amazing sunset at the beach last summer... unforgettable!',
            color: 'blue',
            date: new Date().toLocaleDateString(),
            position: { x: 550, y: 150 }
        }
    ];
    saveNotes();
    renderNotes();
    updateStats();
}

// Made with Bob
