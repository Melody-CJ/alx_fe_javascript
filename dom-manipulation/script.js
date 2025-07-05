// Initial quotes array
let quotes = [
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "Motivation" }
];

// Function to show a random quote
function displayRandomQuote() {
  if (quotes.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "No quotes available.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  document.getElementById("quoteDisplay").innerHTML = `"${quote.text}" — [${quote.category}]`;
}

// Function to add a new quote
function addQuote() {
  const quoteText = document.getElementById("newQuoteText").value.trim();
  const quoteCategory = document.getElementById("newQuoteCategory").value.trim();

  if (quoteText === '' || quoteCategory === '') {
    alert("Please fill in both fields.");
    return;
  }

  const newQuote = {
    text: quoteText,
    category: quoteCategory
  };

  quotes.push(newQuote); // Update in-memory array
  alert("Quote added successfully!");

  // Clear input fields
  document.getElementById("newQuoteText").value = '';
  document.getElementById("newQuoteCategory").value = '';
}

// Attach event to "Show New Quote" button
document.getElementById("newQuote").addEventListener("click", displayRandomQuote);

// Optional: Show a quote on page load
showRandomQuote();
