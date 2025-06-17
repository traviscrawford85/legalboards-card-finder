document.getElementById("search").addEventListener("click", () => {
  const query = document.getElementById("query").value.trim();
  const resultsDiv = document.getElementById("results");
  
  if (!query) {
    resultsDiv.textContent = "Please enter a search query.";
    return;
  }
  
  resultsDiv.textContent = "Searching...";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    
    // Check if we're on a legalboards page
    if (!tab.url.includes('legalboards.app') && !tab.url.includes('legalboards.com') && !tab.url.includes('legalboards.io')) {
      resultsDiv.textContent = "Please navigate to a Legalboards page first.";
      return;
    }
    
    chrome.tabs.sendMessage(tab.id, { type: "SEARCH_MATTER", query }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Extension error:", chrome.runtime.lastError);
        resultsDiv.textContent = "Error: Content script not loaded. Please refresh the page.";
        return;
      }
      
      if (response) {
        if (response.message) {
          resultsDiv.textContent = response.message;
        } else if (response.matches && response.matches.length > 0) {
          resultsDiv.innerHTML = "<b>Found " + response.matches.length + " match(es)" + 
            (response.totalCards ? " out of " + response.totalCards + " cards" : "") + ":</b><ul>" +
            response.matches.map(m => {
              const displayText = m.matterName ? 
                `${m.matterName}${m.matterID && m.matterID !== 'No ID' ? ` (${m.matterID})` : ''}` : 
                m.matterID;
              return `<li>${displayText} - <em>${m.column}</em></li>`;
            }).join("") +
            "</ul>";
        } else {
          resultsDiv.textContent = "No matches found for '" + query + "'" + 
            (response.totalCards ? " among " + response.totalCards + " cards." : ".");
        }
      } else {
        resultsDiv.textContent = "No response from content script. Please refresh the page.";
      }
    });
  });
});

// Allow Enter key to trigger search
document.getElementById("query").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("search").click();
  }
});
