const textInput = document.getElementById('textInput');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const charNoSpace = document.getElementById('charNoSpace');
const sentenceCount = document.getElementById('sentenceCount');
const paragraphCount = document.getElementById('paragraphCount');
const readingTime = document.getElementById('readingTime');
const charLimit = document.getElementById('charLimit');
const keywordDensity = document.getElementById('keywordDensity');

const MAX_CHARS = 10000;

const SENTENCE_ENDINGS = /[.!?。！？…\u3002\uff01\uff1f]+/;

function isAsianCharacter(char) {
    const code = char.charCodeAt(0);
    return (code >= 0x3040 && code <= 0x30FF) ||
           (code >= 0x4E00 && code <= 0x9FFF) ||
           (code >= 0xAC00 && code <= 0xD7AF) ||
           (code >= 0x0600 && code <= 0x06FF) ||
           (code >= 0x0900 && code <= 0x097F);
}

function countWords(text) {
    if (!text.trim()) return [];
    
    const chars = [...text];
    let words = [];
    let currentWord = '';
    let i = 0;
    
    while (i < chars.length) {
        const char = chars[i];
        
        if (char === "'" && i + 1 < chars.length && chars[i + 1].match(/[a-zA-Z]/)) {
            currentWord += char;
            i++;
            continue;
        }
        
        if (char.match(/[\s\n\r\t]/) || char.match(/[,;:()"']/)) {
            if (currentWord) {
                words.push(currentWord);
                currentWord = '';
            }
        } else if (isAsianCharacter(char)) {
            if (currentWord) {
                words.push(currentWord);
                currentWord = '';
            }
            words.push(char);
        } else {
            currentWord += char;
        }
        i++;
    }
    
    if (currentWord) {
        words.push(currentWord);
    }
    
    return words;
}

function countSentences(text) {
    if (!text.trim()) return [];
    
    const sentences = text.split(SENTENCE_ENDINGS)
        .filter(s => s.trim().length > 0);
    
    return sentences;
}

function countParagraphs(text) {
    if (!text.trim()) return [];
    
    const paragraphs = text.split(/\n\s*\n/)
        .filter(p => p.trim().length > 0);
    
    return paragraphs;
}

function estimateReadingTime(wordCount) {
    if (wordCount === 0) return 0;
    return Math.ceil(wordCount / 200);
}

function extractKeywords(words) {
    const stopWords = new Set([
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
        'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
        'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
        'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
        'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
        'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
        'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
        'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
        'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
        'give', 'day', 'most', 'us'
    ]);
    
    const freq = {};
    
    words.forEach(word => {
        const clean = word.toLowerCase().replace(/[^a-z\u00C0-\u017F\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\uAC00-\uD7AF\u0900-\u097F]/gi, '');
        if (clean && clean.length > 1 && !stopWords.has(clean.toLowerCase())) {
            freq[clean] = (freq[clean] || 0) + 1;
        }
    });
    
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
}

textInput.addEventListener('input', function() {
    const text = this.value;
    
    if (text.length > MAX_CHARS) {
        this.value = text.substring(0, MAX_CHARS);
        charLimit.style.color = '#ef4444';
    } else {
        charLimit.style.color = '#6b7280';
    }
    
    updateStats();
});

function updateStats() {
    const text = textInput.value;
    
    const words = countWords(text);
    const wordCountValue = words.length;
    wordCount.textContent = wordCountValue;
    
    charCount.textContent = text.length;
    charNoSpace.textContent = text.replace(/\s/g, '').length;
    
    const sentences = countSentences(text);
    sentenceCount.textContent = sentences.length;
    
    const paragraphs = countParagraphs(text);
    paragraphCount.textContent = paragraphs.length;
    
    const readingTimeValue = estimateReadingTime(wordCountValue);
    readingTime.textContent = readingTimeValue;
    
    charLimit.textContent = `${text.length} / ${MAX_CHARS}`;
    
    updateKeywordDensity(words);
}

function updateKeywordDensity(words) {
    if (words.length === 0) {
        keywordDensity.innerHTML = 'Type something to see keywords...';
        return;
    }
    
    const keywords = extractKeywords(words);
    
    if (keywords.length === 0) {
        keywordDensity.innerHTML = 'No significant keywords found...';
        return;
    }
    
    const totalWords = words.length;
    const html = keywords.map(([word, count]) => {
        const percentage = ((count / totalWords) * 100).toFixed(1);
        return `<span class="keyword-tag">${word} (${count} - ${percentage}%)</span>`;
    }).join(' ');
    
    keywordDensity.innerHTML = html;
}

function clearText() {
    if (textInput.value && confirm('Clear all text?')) {
        textInput.value = '';
        updateStats();
    }
}

function copyText() {
    const text = textInput.value;
    if (!text) {
        alert('Nothing to copy!');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.btn-copy');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(() => {
        alert('Failed to copy!');
    });
}

function exportText() {
    const text = textInput.value;
    if (!text) {
        alert('Nothing to export!');
        return;
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `word-counter-export-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

textInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 400) + 'px';
});

updateStats();
