let allCards = [];
let isDebugMode = true; // Set to false to reduce console output

const log = (message, data = null) => {
  if (isDebugMode) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

// Log current URL and page info for debugging
log(`🌐 Card Finder loaded on: ${window.location.href}`);
log(`📄 Page title: ${document.title}`);

const extractCards = () => {
  allCards = [];

  // Try multiple selectors for cards - legalboards might use different classes
  const cardSelectors = [
    'div.card',
    '.card',
    '[class*="card"]',
    '[class*="matter"]',
    '[class*="item"]',
    '[class*="task"]',
    '.kanban-card',
    '.board-card',
    '[data-card]',
    '[draggable="true"]',
    // Additional selectors for modern web apps
    '[class*="draggable"]',
    '[class*="tile"]',
    '[class*="panel"]',
    '.list-group-item',
    '[role="listitem"]',
    '[class*="grid-item"]'
  ];
  
  let cards = [];
  for (const selector of cardSelectors) {
    cards = document.querySelectorAll(selector);
    if (cards.length > 0) {
      log(`✅ Found ${cards.length} cards using selector: ${selector}`);
      break;
    }
  }

  if (cards.length === 0) {
    log('⚠️ No cards found with any selector. Page might still be loading.');
    return;
  }

  cards.forEach((card, index) => {
    // Skip cards that are likely UI elements, not matter cards
    if (card.classList.contains('border-0') || 
        card.classList.contains('select') ||
        card.style.border === 'none !important' ||
        card.offsetHeight < 50 || // Very small cards are likely not matters
        !card.offsetParent) { // Hidden cards
      return;
    }
    // Try multiple approaches to find the matter ID
    let matterID = null;
    let foundMethod = null;

    // Method 1: Look for the YYYY-NNNNN pattern in the full text first
    const allText = card.innerText || card.textContent || '';
    const matterIdPattern = /\b(\d{4}-\d{5})\b/g;
    const matches = allText.match(matterIdPattern);
    if (matches && matches.length > 0) {
      matterID = matches[0];
      foundMethod = 'text-pattern-match';
    }

    // Method 2: Original approach - h5 with spans (only if no ID found yet)
    if (!matterID) {
      const h5 = card.querySelector('h5.card-title, h5, .card-title');
      if (h5) {
        const spans = h5.querySelectorAll('span.ng-binding, span');
        if (spans.length > 0) {
          const lastSpan = spans[spans.length - 1];
          const text = lastSpan.innerText.trim();
          if (text && text.match(/^\d{4}-\d{5}$/)) {
            matterID = text;
            foundMethod = 'h5-span';
          }
        }
      }
    }

    // Method 3: Look for any element with matter-like text
    if (!matterID) {
      const textElements = card.querySelectorAll('*');
      for (const element of textElements) {
        const text = element.innerText?.trim();
        if (text && /^\d{4}-\d{5}$/.test(text)) {
          matterID = text;
          foundMethod = 'element-search';
          break;
        }
      }
    }

    // Extract matter name/title - look for the main text content
    let matterName = '';
    let matterTitle = '';
    let allTextContent = '';
    
    // Get all text content from the card for analysis
    allTextContent = card.innerText || card.textContent || '';
    
    // Parse the specific structure we can see from the logs:
    // Line 1: "Joseph N. Steiner" (full name)
    // Line 2: empty
    // Line 3: "2020-00025 Steiner,Joseph" (ID and formatted name)
    // Line 4: "General Negligence" (case type)
    // Line 5: "New" or days count
    
    const lines = allTextContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Method 1: Look for the first line which should be the full client name
    if (lines.length > 0) {
      const firstLine = lines[0];
      // If first line looks like a name (contains letters and spaces, not just case types)
      if (firstLine && 
          firstLine.length > 3 && 
          firstLine.length < 100 &&
          /^[A-Za-z\s.,'-]+$/.test(firstLine) &&
          !['General Negligence', 'Auto Accident', 'School Case', 'Medical Malpractice', 
            'Workers Compensation', 'Workers\' Compensation', 'Premises Liability', 
            'Wrongful Termination', 'PI', '3rd Party', 'New', 'Card Pinned'].includes(firstLine)) {
        matterTitle = firstLine;
      }
    }
    
    // Method 2: Look for the line with matter ID and name (format: "YYYY-NNNNN LastName,FirstName")
    if (!matterTitle) {
      for (const line of lines) {
        // Look for pattern: number + space + name with comma
        const idNameMatch = line.match(/^(\d{4}-\d{5})\s+(.+)$/);
        if (idNameMatch) {
          matterTitle = idNameMatch[2]; // Extract the name part
          break;
        }
      }
    }
    
    // Method 3: Look for any line that contains a comma (likely "LastName,FirstName" format)
    if (!matterTitle) {
      for (const line of lines) {
        if (line.includes(',') && 
            line.length > 3 && 
            line.length < 100 &&
            /^[A-Za-z\s.,'-]+$/.test(line) &&
            !line.includes('Card Pinned')) {
          matterTitle = line;
          break;
        }
      }
    }
    
    // Method 4: Traditional fallback methods from before
    if (!matterTitle) {
      const nameSelectors = [
        '.card-body', '.card-text', 'p', 'div', 'span',
        '[class*="name"]', '[class*="client"]', '[class*="matter"]'
      ];
      
      for (const selector of nameSelectors) {
        const elements = card.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.innerText?.trim();
          if (text && text.length > 3 && text.length < 200) {
            // Look for text that contains common name patterns
            if (text.includes(',') || 
                (text.includes(' ') && text.split(' ').length >= 2 && text.split(' ').length <= 6) ||
                /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text)) {
              matterTitle = text;
              break;
            }
          }
        }
        if (matterTitle) break;
      }
    }
    
    matterName = matterTitle || 'Untitled';
    
    // Log the full text content for debugging
    if (index < 5) { // Only log first few cards to avoid spam
      log(`🔍 Card ${index + 1} full text:`, allTextContent);
      log(`🔍 Card ${index + 1} lines:`, lines);
      log(`🔍 Card ${index + 1} extracted name:`, matterName);
    }

    if (!matterID && !matterName) {
      log(`⚠️ No matter ID or name found in card ${index + 1}`, {
        element: card,
        textContent: allTextContent.substring(0, 200) + '...'
      });
      return;
    }

    // Find the column container - try more specific approaches
    const columnSelectors = [
      '.column', '.Column', '.stage', '.list', '.board-list', '.kanban-column',
      '[class*="column"]', '[class*="stage"]', '[class*="list"]', '[class*="kanban"]',
      // Try going up the DOM tree to find containers
      '.col', '.col-md', '.col-lg', '.col-sm', '[class*="col-"]'
    ];
    
    let column = null;
    let columnName = 'Unknown';
    
    // Try to find column by traversing up the DOM
    let currentElement = card;
    let traverseCount = 0;
    
    while (currentElement && traverseCount < 10) {
      for (const selector of columnSelectors) {
        const potentialColumn = currentElement.closest(selector);
        if (potentialColumn && potentialColumn !== currentElement) {
          column = potentialColumn;
          break;
        }
      }
      if (column) break;
      
      currentElement = currentElement.parentElement;
      traverseCount++;
    }
    
    // If found a column, try to extract its title
    if (column) {
      const titleSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        '.column-title', '.stage-title', '.list-title', '.kanban-title',
        '[class*="title"]', '[class*="header"]', '[class*="label"]',
        '.badge', '.btn', 'strong', 'b'
      ];
      
      for (const selector of titleSelectors) {
        const titleElement = column.querySelector(selector);
        if (titleElement && titleElement.innerText?.trim()) {
          const titleText = titleElement.innerText.trim();
          if (titleText.length > 0 && titleText.length < 100) {
            columnName = titleText;
            break;
          }
        }
      }
      
      // Also try looking at the column's immediate text content
      if (columnName === 'Unknown') {
        const directText = column.childNodes[0]?.textContent?.trim();
        if (directText && directText.length > 0 && directText.length < 50) {
          columnName = directText;
        }
      }
    }
    
    // If still unknown, try looking at parent containers
    if (columnName === 'Unknown') {
      let parent = card.parentElement;
      let parentLevel = 0;
      
      while (parent && parentLevel < 5) {
        const parentText = Array.from(parent.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent?.trim())
          .filter(text => text && text.length > 0 && text.length < 50)
          .join(' ');
          
        if (parentText) {
          columnName = parentText;
          break;
        }
        
        parent = parent.parentElement;
        parentLevel++;
      }
    }

    allCards.push({
      matterID: matterID || 'No ID',
      matterName: matterName,
      title: matterName, // For backward compatibility
      column: columnName,
      element: card,
      foundMethod
    });

    log(`🗂️ Indexed card: ID="${matterID || 'No ID'}" Name="${matterName}" in column "${columnName}" (method: ${foundMethod})`);
  });

  log(`✅ Total indexed: ${allCards.length} cards`);
};

// Debounce the extraction to avoid excessive calls
let extractTimeout;
const debouncedExtract = () => {
  clearTimeout(extractTimeout);
  extractTimeout = setTimeout(extractCards, 500);
};

// Always update the index when the page changes
const observer = new MutationObserver(debouncedExtract);
observer.observe(document.body, { childList: true, subtree: true });

// Initial extraction with multiple retry attempts
const initializeExtraction = () => {
  let retryCount = 0;
  const maxRetries = 5;
  
  const tryExtraction = () => {
    retryCount++;
    log(`🔄 Extraction attempt ${retryCount}/${maxRetries}`);
    
    extractCards();
    
    // If no cards found and we have retries left, try again
    if (allCards.length === 0 && retryCount < maxRetries) {
      setTimeout(tryExtraction, 1000 * retryCount); // Increasing delay
    } else if (allCards.length > 0) {
      log(`✅ Successfully found ${allCards.length} cards on attempt ${retryCount}`);
    } else {
      log(`⚠️ No cards found after ${maxRetries} attempts. This might be expected if the page doesn't contain cards.`);
    }
  };
  
  // Start trying immediately
  tryExtraction();
};

// Wait for page to be ready and then initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtraction);
} else {
  initializeExtraction();
}

// Also extract on window load
window.addEventListener('load', extractCards);

// Handle search from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SEARCH_MATTER") {
    log(`🔍 Received search request for: "${request.query}"`);
    
    // Always do a fresh extraction before searching
    extractCards();
    
    const query = request.query.toLowerCase().trim();
    if (!query) {
      sendResponse({ matches: [], message: "Please enter a search query" });
      return;
    }
    
    // If no cards were found at all, provide helpful message
    if (allCards.length === 0) {
      log(`⚠️ No cards indexed. Page might not be a board view or still loading.`);
      sendResponse({ 
        matches: [], 
        message: "No cards found on this page. Make sure you're on a board view and the page has finished loading." 
      });
      return;
    }
    
    // Search both matter ID and matter name/title
    const matches = allCards.filter(c => {
      const id = (c.matterID || '').toLowerCase();
      const name = (c.matterName || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      
      return id.includes(query) || name.includes(query) || title.includes(query);
    });

    log(`🔍 Searching "${query}" → found ${matches.length} matches out of ${allCards.length} total cards`);
    
    // Log detailed search results
    if (matches.length > 0) {
      log(`✅ Matches found:`, matches.map(m => ({
        id: m.matterID,
        name: m.matterName,
        column: m.column
      })));
    } else {
      log(`❌ No matches. First 5 cards to check:`, allCards.slice(0, 5).map(c => ({ 
        id: c.matterID, 
        name: c.matterName, 
        column: c.column 
      })));
    }

    if (matches.length > 0) {
      // Scroll to and highlight the first match
      const card = matches[0].element;
      
      // Remove any existing highlights first
      document.querySelectorAll('[data-finder-highlight]').forEach(el => {
        el.style.outline = '';
        el.removeAttribute('data-finder-highlight');
      });
      
      // Scroll to the card
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Highlight the card
      card.style.outline = "3px solid #ff4444";
      card.style.outlineOffset = "2px";
      card.setAttribute('data-finder-highlight', 'true');

      // Remove highlight after 5 seconds
      setTimeout(() => {
        card.style.outline = "";
        card.style.outlineOffset = "";
        card.removeAttribute('data-finder-highlight');
      }, 5000);
    }

    sendResponse({
      matches: matches.map(c => ({
        matterID: c.matterID,
        matterName: c.matterName,
        title: c.matterName || c.matterID, // Prefer name over ID for display
        column: c.column,
        foundMethod: c.foundMethod
      })),
      totalCards: allCards.length,
      message: matches.length === 0 ? `No matches found for "${query}" among ${allCards.length} cards` : null
    });
    
    return true; // Indicate we will send a response asynchronously
  }
});

// Add a simple way to test the extension from console
window.testCardFinder = () => {
  extractCards();
  console.log('Extracted cards:', allCards);
  console.log('Card details:', allCards.map(c => ({
    id: c.matterID,
    name: c.matterName,
    column: c.column,
    method: c.foundMethod,
    element: c.element
  })));
  return allCards;
};

// Add a function to debug search
window.debugSearch = (query) => {
  const q = query.toLowerCase().trim();
  console.log(`Debugging search for: "${q}"`);
  
  allCards.forEach((card, index) => {
    const id = (card.matterID || '').toLowerCase();
    const name = (card.matterName || '').toLowerCase();
    const idMatch = id.includes(q);
    const nameMatch = name.includes(q);
    
    console.log(`Card ${index + 1}:`, {
      matterID: card.matterID,
      matterName: card.matterName,
      column: card.column,
      idMatch,
      nameMatch,
      overall: idMatch || nameMatch
    });
  });
};
