# 🔍 Legalboards Card Finder Chrome Extension

A simple Chrome Extension that helps you **instantly find a card on your Legalboards kanban board** by searching for either a **Matter ID** or a **Client Name** — then automatically scrolls to the card and highlights it.

---

## 🚀 Features

✅ **Search by Matter ID or Client Name**  
✅ Scrolls directly to the matching card  
✅ Highlights the card for quick visual location  
✅ Works entirely client-side — no server needed  
✅ Keeps up with live board changes automatically

---

## 📁 Project Structure

```legalboards-card-finder/
├── manifest.json # Chrome Extension manifest (v3)
├── popup.html # Simple popup UI for entering search queries
├── popup.js # Handles popup logic and sends search requests
├── content.js # Runs in the Legalboards page, indexes cards, and scrolls to matches
```

---

## ⚙️ How It Works

- When you open your Legalboards board, the `content.js` script runs automatically.
- It scans all cards on the board and records:
  - **Matter ID** (from the `<span>` inside the card)
  - **Client Name** (from the `<h5>` title minus the span)
  - **Column name** (the board stage it’s in)
- In the popup, you enter any text — it matches either field.
- It scrolls to the first match and highlights it in red for 5 seconds.

---

## 🏁 How to Install

1️⃣ Clone this repository or download it as a ZIP and unzip it.  
2️⃣ Open Chrome and go to:  

### chrome://extensions

3️⃣ Enable **Developer Mode** (top right corner).  
4️⃣ Click **"Load unpacked"** and select the project folder.  
5️⃣ Pin the extension icon for easy access (optional).

---

## ✅ How to Use

1. Open your **Legalboards board** in a new Chrome tab.  
2. Click the extension icon (puzzle piece).  
3. Enter either a **Matter ID** (`2020-00025`) or **Client Name** (`Steiner`).  
4. Click **Search**.
5. The matching card will scroll into view and be outlined in red.

---

## 🔑 Important

- This extension works entirely **locally** — no data is sent or stored.
- It assumes your Legalboards board structure includes:
- A `<div class="card">` for each card.
- A `<h5 class="card-title">` with client name text and a nested `<span class="ng-binding">` for the Matter ID.

If your board structure changes, adjust the `content.js` selectors to match.

---

## 🧩 Customize

- To change highlight color or duration, edit `content.js`:

```js
card.style.outline = "3px solid red";
setTimeout(() => {
  card.style.outline = "";
}, 5000); // milliseconds
```

- To add more advanced filters (e.g., search only by Matter ID or only by Client Name), enhance `popup.html` and `popup.js`.

---

## 💡 Roadmap Ideas

✅ Toggle to search by Matter ID or Client Name  
✅ Export matching cards to CSV  
✅ Multi-match highlight  
✅ Better styling for popup

---

## 📜 License

This project is open source under the MIT License.  
Use, adapt, and improve freely.

---

## ✨ Feedback & Contributions

Questions or improvements?  
Open an issue or submit a pull request!

---

### 👤 Author

Travis Crawford  
Clio Certified Partner | Full Stack Developer | LegalTech Architect  
📧 solutionpartner@cfelab.com | [LinkedIn](https://www.linkedin.com/in/crawford-t)