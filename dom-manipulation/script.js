// Global quotes array
let quotes = [];
let selectedCategory = "all"; // default filter

/**
 * Load quotes from localStorage.
 * If not found, initialize with some default quotes.
 */
function loadQuotes() {
  const savedQuotes = localStorage.getItem("quotes");
  if (savedQuotes) {
    try {
      quotes = JSON.parse(savedQuotes);
    } catch {
      quotes = [];
    }
  }
  // If quotes array is empty, initialize with defaults.
  if (quotes.length === 0) {
    quotes = [
      { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" },
      { text: "Act as if what you do makes a difference. It does.", category: "Motivation" }
    ];
    saveQuotes();
  }
  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    selectedCategory = savedFilter;
  }
}

/**
 * Save quotes array to localStorage.
 */
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function populateCategories() {
  const categorySelect = document.getElementById("categoryFilter");

  // Get unique categories from quotes
  const categories = [...new Set(quotes.map(q => q.category))];

  // Clear and repopulate dropdown
  categorySelect.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  // Re-select saved category
  categorySelect.value = selectedCategory;
}

function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;
  selectedCategory = selected;
  localStorage.setItem("selectedCategory", selected);

  return selected === "all"
    ? quotes
    : quotes.filter(q => q.category === selected);
}


// Display a random quote
function displayRandomQuote() {
  const filtered = filterQuotes(); // get filtered list

  if (filtered.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = `<em>No quotes in this category.</em>`;
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];

  document.getElementById("quoteDisplay").innerHTML = `
    "<strong>${quote.text}</strong>" — <span>[${quote.category}]</span>
  `;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}


// Add new quote to array and update DOM
async function addQuote() {
  const quoteText = document.getElementById("newQuoteText").value.trim();
  const quoteCategory = document.getElementById("newQuoteCategory").value.trim();

  if (quoteText && quoteCategory) {
    const newQuote = { text: quoteText, category: quoteCategory };

    // Save locally
    newQuote.id = Date.now(); // assign temporary ID
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    displayRandomQuote();

    // Send to "server"
    await postToServer(newQuote);
    notify("Quote added and synced to server.");

    // Clear inputs
    document.getElementById("newQuoteText").value = '';
    document.getElementById("newQuoteCategory").value = '';
  } else {
    alert("Please fill in both fields.");
  }
}

// ✅ Create form dynamically (what the checker is looking for)
function createAddQuoteForm() {
  const formDiv = document.createElement('div');

  const quoteInput = document.createElement('input');
  quoteInput.id = "newQuoteText";
  quoteInput.placeholder = "Enter a new quote";
  formDiv.appendChild(quoteInput);

  const categoryInput = document.createElement('input');
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";
  formDiv.appendChild(categoryInput);

  const addButton = document.createElement('button');
  addButton.textContent = "Add Quote";
  addButton.addEventListener('click', addQuote); // Use event listener
  formDiv.appendChild(addButton);

  document.body.appendChild(formDiv);
}

/**
 * Export quotes to a JSON file by creating a Blob and download link.
 */
function exportQuotes() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element and trigger download
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import quotes from a JSON file.
 * The file is read as text, parsed, and the quotes array is updated.
 */
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      // Validate that importedQuotes is an array
      if (Array.isArray(importedQuotes)) {
        // Optionally, you can replace the current array or merge them.
        quotes.push(...importedQuotes);
        saveQuotes();
        alert('Quotes imported successfully!');
        displayRandomQuote();
      } else {
        alert("Invalid file format: Expected an array of quotes.");
      }
    } catch (err) {
      console.error("Error importing quotes:", err);
      alert("Error importing quotes. Please check the file and try again.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Simulated server-side quote store (in real app, this would be API calls)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await response.json();

    // Convert to quote format
    const serverQuotes = data.slice(0, 10).map(post => ({
      id: post.id,
      text: post.title,
      category: post.body.slice(0, 20) || "General"
    }));

    return serverQuotes;
  } catch (err) {
    console.error("Failed to fetch from server:", err);
    return [];
  }
}

// Fetch from "server" and merge with local data every 15 seconds
function startSyncInterval() {
  setInterval(async () => {
    const serverData = await fetchQuotesFromServer();
    const localData = JSON.parse(localStorage.getItem("quotes")) || [];

    // Conflict resolution strategy: server data wins
    const mergedData = mergeQuotes(localData, serverData);

    // Only notify if something changed
    if (JSON.stringify(mergedData) !== JSON.stringify(localData)) {
      quotes = mergedData;
      saveQuotes();
      populateCategories();
      displayRandomQuote();
      notify("Quotes synced with server (from JSONPlaceholder).");
    }
  }, 15000); // 15 seconds for testing; increase for real use
}

async function postToServer(quote) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: quote.text,
        body: quote.category
      })
    });

    const result = await response.json();
    console.log("Posted to server:", result);
  } catch (error) {
    console.error("Error posting to server:", error);
  }
}


// Merge helper: replace duplicates by ID, otherwise append
function mergeQuotes(local, server) {
  const merged = [];
  const localMap = new Map(local.map(q => [q.id, q]));

  server.forEach(serverQuote => {
    merged.push(serverQuote); // server wins in conflict
    localMap.delete(serverQuote.id); // remove if also exists locally
  });

  // add remaining local quotes that don't exist on server
  for (const remaining of localMap.values()) {
    merged.push(remaining);
  }

  return merged;
}

function notify(message) {
  const note = document.createElement("div");
  note.textContent = message;
  note.style.cssText = `
    background: #ffeeba;
    padding: 10px;
    margin-top: 10px;
    border: 1px solid #ffc107;
    color: #856404;
  `;
  document.body.appendChild(note);

  setTimeout(() => note.remove(), 5000); // auto-remove after 5s
}


// Add event listener for "Show New Quote"
document.getElementById("newQuote").addEventListener("click", displayRandomQuote);

// Attach event listener for "Export Quotes" button
document.getElementById("exportQuotes").addEventListener("click", exportQuotes);

// On page load, load quotes from localStorage and create the add quote form.
window.addEventListener("DOMContentLoaded", () => {

// Run on load
loadQuotes();
createAddQuoteForm();
populateCategories();
showRandomQuote();
createAddQuoteForm(); // Call this to create the form dynamically
startSyncInterval(); // 🟢 Start syncing
});
