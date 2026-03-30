const geminiApiKey = "Your API key must be here";

//create trip page
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tripForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Collect inputs
      const destination = document.getElementById("destination").value;
      const days = document.getElementById("days").value;
      const budget = document.querySelector(".card.selected[data-type='budget']")?.dataset.value || "";
      const companion = document.querySelector(".card.selected[data-type='companion']")?.dataset.value || "";

      // Save to localStorage
      const tripData = { destination, days, budget, companion };
      localStorage.setItem("tripData", JSON.stringify(tripData));

      // Redirect
      window.location.href = "view_trip.html";
    });
  }

  // Enable card selection
  const cards = document.querySelectorAll(".card-group .card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.type;
      document.querySelectorAll(`.card[data-type="${type}"]`).forEach(c => c.classList.remove("selected"));
      card.parentNode.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });
});

// view trip page
if (document.body.classList.contains("itinerary-page-body")) {
  document.addEventListener("DOMContentLoaded", async () => {
    const tripData = JSON.parse(localStorage.getItem("tripData"));
    if (!tripData) {
      alert("⚠️ No trip data found. Please create a new trip.");
      return;
    }

    const itineraryContainer = document.getElementById("itinerary-container");
    const hotelsContainer = document.getElementById("hotels-container");

    itineraryContainer.innerHTML = `<p>Creating itinerary for <b>${tripData.destination}</b>...</p>`;

    try {
      //prompt
      const prompt = `
      You are an expert AI Trip Planner.  
      Plan a ${tripData.days}-day trip to ${tripData.destination} for ${tripData.companion} with a ${tripData.budget} budget.  

      Your response **must** include these two sections in Markdown:
      
      Prices should be displayed in INR.

      ## Suggested Itinerary
      (Day-by-day plan with bullet points and timings)
      (Also things to do with the companion you are traveling with)

      ## Recommended Hotels & Places
      - List at least 3 hotels (name + why it fits the budget)  
      - List at least 3 restaurants or must-try food places  
      - List 2–3 sightseeing spots  
      `;

      // API call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const data = await response.json();
      console.log("AI Response:", data);

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Failed to get AI response";

      // Split AI response into sections
      const parts = aiText.split("## Recommended Hotels & Places");

      let itineraryMarkdown = parts[0] || "⚠️ No itinerary found.";
      let hotelsMarkdown = parts[1] ? "## Recommended Hotels & Places" + parts[1] : "⚠️ No hotel recommendations found.";

    // Render into separate containers
      itineraryContainer.innerHTML = marked.parse(itineraryMarkdown);
      hotelsContainer.innerHTML = marked.parse(hotelsMarkdown);

    } catch (error) {
      console.error("AI fetch error:", error);
      itineraryContainer.innerText = "❌ Error fetching AI response. Please try again.";
    }
  });
}
