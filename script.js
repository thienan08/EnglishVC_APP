// Storage key
const STORAGE_KEY = 'vocabLearning';

// State
let currentDayId = null;
let currentTestType = null; // 1, 2, or 3
let allTestsResults = {
    test1: { correct: [], wrong: [] },
    test2: { correct: [], wrong: [] },
    test3: { correct: [], wrong: [] }
};
let completedTests = new Set(); // Track which tests are completed

// Test Type 1 & 2 (Typing)
let typingTestWords = [];
let currentTypingIndex = 0;
let hasShownAnswer = false;

// Test Type 3 (Matching)
let matchingRounds = [];
let currentMatchingRound = 0;
let selectedEnglish = null;
let selectedVietnamese = null;
let currentRoundMatches = [];
let currentRoundCorrect = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadDays();
});

// Initialize app
function initializeApp() {
    // Check if data exists, if not create initial structure
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ days: [] }));
    }
    
    // Check theme preference
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Add day
    document.getElementById('addDayBtn').addEventListener('click', () => openModal());
    document.getElementById('confirmDayBtn').addEventListener('click', addDay);
    document.getElementById('cancelDayBtn').addEventListener('click', closeModal);
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    
    // Modal - close on outside click
    document.getElementById('addDayModal').addEventListener('click', (e) => {
        if (e.target.id === 'addDayModal') closeModal();
    });
    
    // Vocabulary management
    document.getElementById('backToList').addEventListener('click', showDayList);
    document.getElementById('addVocabBtn').addEventListener('click', addVocabulary);
    
    // Enter key for adding vocab
    document.getElementById('englishInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('vietnameseInput').focus();
    });
    document.getElementById('vietnameseInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addVocabulary();
    });
    
    // Enter key for modal
    document.getElementById('dayNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addDay();
    });
    
    // Test Selection
    document.getElementById('startTestBtn').addEventListener('click', openTestSelection);
    document.getElementById('backFromSelection').addEventListener('click', () => {
        showView('vocabManageView');
    });
    
    // Test type selection
    document.querySelectorAll('.test-type-card').forEach(card => {
        card.addEventListener('click', () => {
            const testType = parseInt(card.dataset.type);
            startTest(testType);
        });
    });
    
    // Typing Test (Test 1 & 2)
    document.getElementById('exitTypingTest').addEventListener('click', exitTypingTest);
    document.getElementById('showTypingAnswerBtn').addEventListener('click', showTypingAnswer);
    document.getElementById('nextTypingWordBtn').addEventListener('click', nextTypingWord);
    document.getElementById('typingAnswerInput').addEventListener('input', checkTypingAnswer);
    document.getElementById('typingAnswerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !document.getElementById('nextTypingWordBtn').disabled) {
            nextTypingWord();
        }
    });
    
    // Matching Test (Test 3)
    document.getElementById('exitMatchingTest').addEventListener('click', exitMatchingTest);
    document.getElementById('nextMatchingRound').addEventListener('click', nextMatchingRound);
    
    // Result
    document.getElementById('retryTestBtn').addEventListener('click', retryAllTests);
    document.getElementById('backToVocabBtn').addEventListener('click', () => {
        showView('vocabManageView');
    });
}

// Theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Data management
function getData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCurrentDay() {
    const data = getData();
    return data.days.find(day => day.id === currentDayId);
}

// Create Cambridge Dictionary link
function getCambridgeLink(word) {
    const cleanWord = word.trim().toLowerCase().replace(/\s+/g, '-');
    return `https://dictionary.cambridge.org/dictionary/english/${cleanWord}`;
}

// Create pronunciation button
function createPronunciationButton(word) {
    const btn = document.createElement('a');
    btn.href = getCambridgeLink(word);
    btn.target = '_blank';
    btn.className = 'btn-pronunciation';
    btn.title = 'Nghe phát âm trên Cambridge';
    btn.innerHTML = '🔊';
    btn.onclick = (e) => e.stopPropagation();
    return btn;
}

// Load days
function loadDays() {
    const data = getData();
    const daysList = document.getElementById('daysList');
    const emptyState = document.getElementById('emptyState');
    
    daysList.innerHTML = '';
    
    if (data.days.length === 0) {
        emptyState.style.display = 'block';
        daysList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        daysList.style.display = 'grid';
        
        data.days.forEach((day, index) => {
            const card = createDayCard(day, index);
            daysList.appendChild(card);
        });
    }
}

// Create day card
function createDayCard(day, index) {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="day-card-header">
            <h3>${day.name}</h3>
            <div class="day-card-actions">
                <button class="btn-small delete-day" data-id="${day.id}" title="Xóa">🗑️</button>
            </div>
        </div>
        <div class="day-card-stats">
            <span>📝 ${day.vocabulary.length} từ</span>
        </div>
    `;
    
    // Click to open
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-day')) {
            openDay(day.id);
        }
    });
    
    // Delete button
    card.querySelector('.delete-day').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteDay(day.id);
    });
    
    return card;
}

// Modal
function openModal() {
    document.getElementById('addDayModal').classList.add('active');
    document.getElementById('dayNameInput').value = '';
    document.getElementById('dayNameInput').focus();
}

function closeModal() {
    document.getElementById('addDayModal').classList.remove('active');
}

// Add day
function addDay() {
    const nameInput = document.getElementById('dayNameInput');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Vui lòng nhập tên ngày!');
        return;
    }
    
    const data = getData();
    const newDay = {
        id: Date.now().toString(),
        name: name,
        vocabulary: [],
        createdAt: new Date().toISOString()
    };
    
    data.days.push(newDay);
    saveData(data);
    
    closeModal();
    loadDays();
}

// Delete day
function deleteDay(dayId) {
    if (!confirm('Bạn có chắc muốn xóa ngày học này?')) return;
    
    const data = getData();
    data.days = data.days.filter(day => day.id !== dayId);
    saveData(data);
    
    loadDays();
}

// Open day
function openDay(dayId) {
    currentDayId = dayId;
    const day = getCurrentDay();
    
    document.getElementById('currentDayTitle').textContent = day.name;
    loadVocabulary();
    showView('vocabManageView');
}

// Load vocabulary
function loadVocabulary() {
    const day = getCurrentDay();
    const vocabList = document.getElementById('vocabList');
    const emptyState = document.getElementById('vocabEmptyState');
    
    vocabList.innerHTML = '';
    
    if (day.vocabulary.length === 0) {
        emptyState.style.display = 'block';
        vocabList.style.display = 'none';
        document.getElementById('startTestBtn').disabled = true;
    } else {
        emptyState.style.display = 'none';
        vocabList.style.display = 'flex';
        document.getElementById('startTestBtn').disabled = false;
        
        day.vocabulary.forEach((vocab, index) => {
            const item = createVocabItem(vocab, index);
            vocabList.appendChild(item);
        });
    }
}

// Create vocab item
function createVocabItem(vocab, index) {
    const item = document.createElement('div');
    item.className = 'vocab-item';
    item.style.animationDelay = `${index * 0.05}s`;
    
    const englishContainer = document.createElement('div');
    englishContainer.className = 'vocab-word';
    
    const englishLabel = document.createElement('span');
    englishLabel.className = 'label';
    englishLabel.textContent = 'Tiếng Anh';
    
    const englishText = document.createElement('span');
    englishText.className = 'text english';
    
    const wordSpan = document.createElement('span');
    wordSpan.textContent = vocab.english;
    englishText.appendChild(wordSpan);
    englishText.appendChild(createPronunciationButton(vocab.english));
    
    englishContainer.appendChild(englishLabel);
    englishContainer.appendChild(englishText);
    
    const vietnameseContainer = document.createElement('div');
    vietnameseContainer.className = 'vocab-word';
    vietnameseContainer.innerHTML = `
        <span class="label">Tiếng Việt</span>
        <span class="text">${vocab.vietnamese}</span>
    `;
    
    const content = document.createElement('div');
    content.className = 'vocab-content';
    content.appendChild(englishContainer);
    content.appendChild(vietnameseContainer);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-small delete-vocab';
    deleteBtn.title = 'Xóa';
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => deleteVocabulary(vocab.id));
    
    item.appendChild(content);
    item.appendChild(deleteBtn);
    
    return item;
}

// Add vocabulary
function addVocabulary() {
    const englishInput = document.getElementById('englishInput');
    const vietnameseInput = document.getElementById('vietnameseInput');
    
    const english = englishInput.value.trim();
    const vietnamese = vietnameseInput.value.trim();
    
    if (!english || !vietnamese) {
        alert('Vui lòng nhập đầy đủ cả tiếng Anh và tiếng Việt!');
        return;
    }
    
    const data = getData();
    const day = data.days.find(d => d.id === currentDayId);
    
    const newVocab = {
        id: Date.now().toString(),
        english: english,
        vietnamese: vietnamese
    };
    
    day.vocabulary.push(newVocab);
    saveData(data);
    
    // Clear inputs
    englishInput.value = '';
    vietnameseInput.value = '';
    englishInput.focus();
    
    // Reload list
    loadVocabulary();
}

// Delete vocabulary
function deleteVocabulary(vocabId) {
    if (!confirm('Bạn có chắc muốn xóa từ này?')) return;
    
    const data = getData();
    const day = data.days.find(d => d.id === currentDayId);
    day.vocabulary = day.vocabulary.filter(v => v.id !== vocabId);
    saveData(data);
    
    loadVocabulary();
}

// Open test selection
function openTestSelection() {
    const day = getCurrentDay();
    
    if (day.vocabulary.length === 0) {
        alert('Chưa có từ vựng nào để test!');
        return;
    }
    
    if (day.vocabulary.length < 5) {
        alert('Cần ít nhất 5 từ vựng để làm bài test!');
        return;
    }
    
    // Reset all tests
    completedTests.clear();
    allTestsResults = {
        test1: { correct: [], wrong: [] },
        test2: { correct: [], wrong: [] },
        test3: { correct: [], wrong: [] }
    };
    
    // Update UI to show which tests are completed
    updateTestSelection();
    
    showView('testSelectionView');
}

// Update test selection UI
function updateTestSelection() {
    document.querySelectorAll('.test-type-card').forEach(card => {
        const testType = parseInt(card.dataset.type);
        if (completedTests.has(testType)) {
            card.style.opacity = '0.6';
            card.style.pointerEvents = 'none';
            const badge = card.querySelector('.test-type-badge');
            badge.textContent = 'Hoàn thành ✓';
            badge.style.background = 'var(--gradient-success)';
        } else {
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
        }
    });
}

// Start test based on type
function startTest(testType) {
    currentTestType = testType;
    
    if (testType === 1 || testType === 2) {
        startTypingTest(testType);
    } else if (testType === 3) {
        startMatchingTest();
    }
}

// ============ TYPING TEST (Test 1 & 2) ============

function startTypingTest(testType) {
    const day = getCurrentDay();
    
    // Shuffle vocabulary
    typingTestWords = [...day.vocabulary].sort(() => Math.random() - 0.5);
    currentTypingIndex = 0;
    
    // Update title
    const title = testType === 1 ? 'Test 1: Việt → Anh' : 'Test 2: Anh → Việt';
    document.getElementById('typingTestTitle').textContent = title;
    
    showView('testTypingView');
    loadTypingQuestion();
}

function loadTypingQuestion() {
    if (currentTypingIndex >= typingTestWords.length) {
        completeTypingTest();
        return;
    }
    
    const word = typingTestWords[currentTypingIndex];
    hasShownAnswer = false;
    
    // Update UI
    document.getElementById('currentTypingQuestion').textContent = currentTypingIndex + 1;
    document.getElementById('totalTypingQuestions').textContent = typingTestWords.length;
    
    const testWordElement = document.getElementById('typingTestWord');
    const questionContainer = testWordElement.parentElement;
    
    // Remove old pronunciation button if exists
    const oldPronBtn = questionContainer.querySelector('.pronunciation-btn-container');
    if (oldPronBtn) oldPronBtn.remove();
    
    // Show question based on test type
    if (currentTestType === 1) {
        testWordElement.textContent = word.vietnamese;
        document.getElementById('typingAnswerInput').placeholder = 'Gõ tiếng Anh...';
    } else {
        testWordElement.textContent = word.english;
        document.getElementById('typingAnswerInput').placeholder = 'Gõ tiếng Việt...';
        
        // Add pronunciation button for Test 2 (showing English word)
        const pronContainer = document.createElement('div');
        pronContainer.className = 'pronunciation-btn-container';
        const pronBtn = createPronunciationButton(word.english);
        pronBtn.innerHTML = '🔊 Nghe phát âm';
        pronContainer.appendChild(pronBtn);
        questionContainer.appendChild(pronContainer);
    }
    
    document.getElementById('typingAnswerInput').value = '';
    document.getElementById('typingAnswerInput').disabled = false;
    document.getElementById('nextTypingWordBtn').disabled = true;
    document.getElementById('showTypingAnswerBtn').disabled = false;
    
    // Hide feedback and answer
    const feedback = document.getElementById('typingFeedbackMessage');
    feedback.classList.remove('show', 'correct', 'wrong');
    
    const answerDisplay = document.getElementById('typingAnswerDisplay');
    answerDisplay.classList.remove('show');
    
    // Focus input
    document.getElementById('typingAnswerInput').focus();
}

function checkTypingAnswer() {
    const input = document.getElementById('typingAnswerInput');
    const userAnswer = input.value.trim().toLowerCase();
    const word = typingTestWords[currentTypingIndex];
    const correctAnswer = currentTestType === 1 
        ? word.english.toLowerCase() 
        : word.vietnamese.toLowerCase();
    
    if (userAnswer === correctAnswer) {
        showTypingFeedback(true);
        document.getElementById('nextTypingWordBtn').disabled = false;
        input.disabled = true;
        
        // Add to correct if not already shown answer
        const testKey = `test${currentTestType}`;
        if (!hasShownAnswer && !allTestsResults[testKey].correct.find(w => w.id === word.id)) {
            allTestsResults[testKey].correct.push(word);
        }
    } else if (userAnswer !== '') {
        // Only show wrong feedback if there's input
        if (userAnswer.length >= correctAnswer.length) {
            showTypingFeedback(false);
        }
    }
}

function showTypingFeedback(isCorrect) {
    const feedback = document.getElementById('typingFeedbackMessage');
    feedback.classList.remove('correct', 'wrong');
    feedback.classList.add(isCorrect ? 'correct' : 'wrong');
    feedback.textContent = isCorrect ? '✓ Chính xác!' : '✗ Sai rồi!';
    feedback.classList.add('show');
}

function showTypingAnswer() {
    const word = typingTestWords[currentTypingIndex];
    const answerDisplay = document.getElementById('typingAnswerDisplay');
    
    const correctAnswer = currentTestType === 1 ? word.english : word.vietnamese;
    answerDisplay.textContent = `Đáp án: ${correctAnswer}`;
    answerDisplay.classList.add('show');
    
    document.getElementById('showTypingAnswerBtn').disabled = true;
    document.getElementById('nextTypingWordBtn').disabled = false;
    
    // Mark that answer was shown
    hasShownAnswer = true;
    
    // Add to wrong answers
    const testKey = `test${currentTestType}`;
    if (!allTestsResults[testKey].wrong.find(w => w.id === word.id) && 
        !allTestsResults[testKey].correct.find(w => w.id === word.id)) {
        allTestsResults[testKey].wrong.push(word);
    }
}

function nextTypingWord() {
    currentTypingIndex++;
    loadTypingQuestion();
}

function exitTypingTest() {
    if (confirm('Bạn có chắc muốn thoát? Kết quả test này sẽ không được lưu.')) {
        showView('testSelectionView');
    }
}

function completeTypingTest() {
    completedTests.add(currentTestType);
    
    // Check if all tests are completed
    if (completedTests.size === 3) {
        showFinalResults();
    } else {
        alert(`Hoàn thành Test ${currentTestType}! Hãy làm tiếp các test còn lại.`);
        showView('testSelectionView');
        updateTestSelection();
    }
}

// ============ MATCHING TEST (Test 3) ============

function startMatchingTest() {
    const day = getCurrentDay();
    
    // Shuffle vocabulary
    const shuffled = [...day.vocabulary].sort(() => Math.random() - 0.5);
    
    // Create 5 rounds of 5 words each
    matchingRounds = [];
    for (let i = 0; i < 5; i++) {
        const startIdx = i * 5;
        const roundWords = shuffled.slice(startIdx, startIdx + 5);
        
        // If not enough words, reuse from beginning
        while (roundWords.length < 5) {
            roundWords.push(shuffled[roundWords.length % shuffled.length]);
        }
        
        matchingRounds.push(roundWords);
    }
    
    currentMatchingRound = 0;
    selectedEnglish = null;
    selectedVietnamese = null;
    
    showView('testMatchingView');
    loadMatchingRound();
}

function loadMatchingRound() {
    if (currentMatchingRound >= 5) {
        completeMatchingTest();
        return;
    }
    
    const roundWords = matchingRounds[currentMatchingRound];
    currentRoundMatches = [];
    currentRoundCorrect = 0;
    selectedEnglish = null;
    selectedVietnamese = null;
    
    // Update progress
    document.getElementById('currentMatchingRound').textContent = currentMatchingRound + 1;
    document.getElementById('totalMatchingRounds').textContent = 5;
    
    // Clear feedback
    document.getElementById('matchingFeedback').textContent = '';
    document.getElementById('matchingFeedback').className = 'matching-feedback';
    document.getElementById('nextMatchingRound').disabled = true;
    
    // Render English words
    const englishContainer = document.getElementById('englishWords');
    englishContainer.innerHTML = '';
    roundWords.forEach((word, index) => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'matching-word';
        wordDiv.dataset.id = word.id;
        wordDiv.dataset.index = index;
        wordDiv.style.animationDelay = `${index * 0.1}s`;
        
        const wordText = document.createElement('span');
        wordText.textContent = word.english;
        wordText.style.flex = '1';
        wordDiv.appendChild(wordText);
        
        const pronBtn = createPronunciationButton(word.english);
        wordDiv.appendChild(pronBtn);
        
        wordDiv.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-pronunciation')) {
                selectEnglishWord(word, wordDiv);
            }
        });
        
        englishContainer.appendChild(wordDiv);
    });
    
    // Render Vietnamese words (shuffled)
    const vietnameseContainer = document.getElementById('vietnameseWords');
    vietnameseContainer.innerHTML = '';
    const shuffledVietnamese = [...roundWords].sort(() => Math.random() - 0.5);
    shuffledVietnamese.forEach((word, index) => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'matching-word';
        wordDiv.textContent = word.vietnamese;
        wordDiv.dataset.id = word.id;
        wordDiv.dataset.index = index;
        wordDiv.style.animationDelay = `${index * 0.1}s`;
        wordDiv.addEventListener('click', () => selectVietnameseWord(word, wordDiv));
        vietnameseContainer.appendChild(wordDiv);
    });
}

function selectEnglishWord(word, element) {
    if (element.classList.contains('matched')) return;
    
    // Deselect previous
    document.querySelectorAll('#englishWords .matching-word').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Select current
    element.classList.add('selected');
    selectedEnglish = { word, element };
    
    // Check if both are selected
    if (selectedVietnamese) {
        checkMatch();
    }
}

function selectVietnameseWord(word, element) {
    if (element.classList.contains('matched')) return;
    
    // Deselect previous
    document.querySelectorAll('#vietnameseWords .matching-word').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Select current
    element.classList.add('selected');
    selectedVietnamese = { word, element };
    
    // Check if both are selected
    if (selectedEnglish) {
        checkMatch();
    }
}

function checkMatch() {
    const feedback = document.getElementById('matchingFeedback');
    
    if (selectedEnglish.word.id === selectedVietnamese.word.id) {
        // Correct match
        selectedEnglish.element.classList.remove('selected');
        selectedEnglish.element.classList.add('matched');
        selectedVietnamese.element.classList.remove('selected');
        selectedVietnamese.element.classList.add('matched');
        
        currentRoundMatches.push({
            word: selectedEnglish.word,
            correct: true
        });
        currentRoundCorrect++;
        
        feedback.textContent = '✓ Chính xác!';
        feedback.className = 'matching-feedback correct';
        
        // Add to correct results
        if (!allTestsResults.test3.correct.find(w => w.id === selectedEnglish.word.id)) {
            allTestsResults.test3.correct.push(selectedEnglish.word);
        }
        
        // Check if round is complete
        if (currentRoundCorrect === 5) {
            setTimeout(() => {
                feedback.textContent = '🎉 Hoàn thành vòng này!';
                document.getElementById('nextMatchingRound').disabled = false;
            }, 500);
        }
    } else {
        // Wrong match
        selectedEnglish.element.classList.add('wrong');
        selectedVietnamese.element.classList.add('wrong');
        
        currentRoundMatches.push({
            word: selectedEnglish.word,
            correct: false
        });
        
        feedback.textContent = '✗ Sai rồi! Thử lại.';
        feedback.className = 'matching-feedback wrong';
        
        // Add to wrong results (only once per word)
        if (!allTestsResults.test3.wrong.find(w => w.id === selectedEnglish.word.id) &&
            !allTestsResults.test3.correct.find(w => w.id === selectedEnglish.word.id)) {
            allTestsResults.test3.wrong.push(selectedEnglish.word);
        }
        
        // Remove wrong class after animation
        setTimeout(() => {
            selectedEnglish.element.classList.remove('wrong', 'selected');
            selectedVietnamese.element.classList.remove('wrong', 'selected');
        }, 500);
    }
    
    selectedEnglish = null;
    selectedVietnamese = null;
}

function nextMatchingRound() {
    currentMatchingRound++;
    loadMatchingRound();
}

function exitMatchingTest() {
    if (confirm('Bạn có chắc muốn thoát? Kết quả test này sẽ không được lưu.')) {
        showView('testSelectionView');
    }
}

function completeMatchingTest() {
    completedTests.add(3);
    
    // Check if all tests are completed
    if (completedTests.size === 3) {
        showFinalResults();
    } else {
        alert('Hoàn thành Test 3! Hãy làm tiếp các test còn lại.');
        showView('testSelectionView');
        updateTestSelection();
    }
}

// Show final results after all 3 tests
function showFinalResults() {
    // Collect all unique wrong words from all tests
    const allWrongWords = new Set();
    Object.values(allTestsResults).forEach(test => {
        test.wrong.forEach(word => allWrongWords.add(word));
    });
    
    // Calculate total stats
    const totalCorrect = allTestsResults.test1.correct.length + 
                         allTestsResults.test2.correct.length + 
                         allTestsResults.test3.correct.length;
    const totalWrong = allWrongWords.size;
    const totalQuestions = totalCorrect + totalWrong;
    const percent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    // Update overall stats
    document.getElementById('correctCount').textContent = totalCorrect;
    document.getElementById('wrongCount').textContent = totalWrong;
    document.getElementById('percentCorrect').textContent = `${percent}%`;
    
    // Update breakdown stats
    document.getElementById('test1Correct').textContent = allTestsResults.test1.correct.length;
    document.getElementById('test1Wrong').textContent = allTestsResults.test1.wrong.length;
    document.getElementById('test2Correct').textContent = allTestsResults.test2.correct.length;
    document.getElementById('test2Wrong').textContent = allTestsResults.test2.wrong.length;
    document.getElementById('test3Correct').textContent = allTestsResults.test3.correct.length;
    document.getElementById('test3Wrong').textContent = allTestsResults.test3.wrong.length;
    
    // Show wrong words
    const wrongWordsContainer = document.getElementById('wrongWordsContainer');
    const wrongWordsSection = document.getElementById('wrongWordsList');
    
    if (allWrongWords.size === 0) {
        wrongWordsSection.style.display = 'none';
    } else {
        wrongWordsSection.style.display = 'block';
        wrongWordsContainer.innerHTML = '';
        
        allWrongWords.forEach(word => {
            const item = document.createElement('div');
            item.className = 'wrong-word-item';
            
            const englishDiv = document.createElement('div');
            englishDiv.className = 'english';
            
            const wordText = document.createElement('span');
            wordText.className = 'word-text';
            wordText.textContent = word.english;
            
            const pronBtn = createPronunciationButton(word.english);
            
            englishDiv.appendChild(wordText);
            englishDiv.appendChild(pronBtn);
            
            const vietnameseDiv = document.createElement('div');
            vietnameseDiv.className = 'vietnamese';
            vietnameseDiv.textContent = word.vietnamese;
            
            item.appendChild(englishDiv);
            item.appendChild(vietnameseDiv);
            
            wrongWordsContainer.appendChild(item);
        });
    }
    
    showView('resultView');
}

// Retry all tests
function retryAllTests() {
    openTestSelection();
}

// Show day list
function showDayList() {
    currentDayId = null;
    showView('dayListView');
    loadDays();
}

// Show view
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
}