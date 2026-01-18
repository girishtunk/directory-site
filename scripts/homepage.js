document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const suggestionsList = document.getElementById("search-suggestions");
  const typeFilter = document.getElementById("type-filter");
  const grid = document.getElementById("property-grid");
  const cards = Array.from(grid.children);
  const paginationContainer = document.getElementById("pagination");

  const itemsPerPage = 9;
  let currentPage = 1;
  let filteredCards = [...cards];

  // Prepare dataset for autocomplete
  const areas = cards.map(card => card.dataset.area);
  const uniqueAreas = [...new Set(areas)];

  function filterProperties(query = "") {
    const type = typeFilter.value;
    const q = query.toLowerCase();

    filteredCards = cards.filter(card => {
      const area = card.dataset.area || "";
      const propertyType = card.dataset.type;
      const matchesSearch = area.includes(q);
      const matchesType = type === "all" || propertyType === type;
      return matchesSearch && matchesType;
    });

    currentPage = 1; // reset page on filter
    showPage(currentPage);
    renderPagination();
  }

  function showPage(page = 1) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    cards.forEach(card => (card.style.display = "none"));
    filteredCards.slice(start, end).forEach(card => (card.style.display = "block"));
  }

  function renderPagination() {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === currentPage) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentPage = i;
        showPage(currentPage);
        renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      paginationContainer.appendChild(btn);
    }
  }

  // Autocomplete
  function showSuggestions(query) {
    suggestionsList.innerHTML = "";
    if (!query) return;

    const matched = uniqueAreas.filter(area =>
      area.toLowerCase().includes(query.toLowerCase())
    );

    matched.forEach(area => {
      const li = document.createElement("li");
      li.textContent = area;
      li.addEventListener("click", () => {
        searchInput.value = area;
        suggestionsList.innerHTML = "";
        filterProperties(area);
      });
      suggestionsList.appendChild(li);
    });
  }

  searchInput.addEventListener("input", e => {
    const query = e.target.value;
    filterProperties(query);
    showSuggestions(query);
  });

  typeFilter.addEventListener("change", () => filterProperties(searchInput.value));

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.innerHTML = "";
    }
  });

  // Initialize
  filterProperties();
});




// const searchInput = document.getElementById("search-input");
// const typeFilter = document.getElementById("type-filter");
// const grid = document.getElementById("property-grid");
// const cards = Array.from(grid.children);

// function filterProperties() {
//   const query = searchInput.value.toLowerCase();
//   const type = typeFilter.value;
//   console.log(`query: ${query}`)
//   console.log(`type: ${query}`)

//   cards.forEach(card => {
//     const area = card.dataset.area || "";
//     const propertyType = card.dataset.type;

//     const matchesSearch = area.includes(query);
//     const matchesType = type === "all" || propertyType === type;

//     card.style.display = matchesSearch && matchesType ? "block" : "none";
//   });
// }
//   console.log("Homepage script")

// searchInput.addEventListener("input", filterProperties);
// typeFilter.addEventListener("change", filterProperties);

// let currentPage = 1;
// const itemsPerPage = 10;

// function showPage(page = 1) {
//   currentPage = page;
//   const start = (page - 1) * itemsPerPage;
//   const end = start + itemsPerPage;

//   cards.forEach((card, i) => {
//     card.style.display = i >= start && i < end ? "block" : "none";
//   });
// }

// showPage(); // show first page


// document.addEventListener("DOMContentLoaded", () => {
// console.log("dom loaded")
//   const searchInput = document.getElementById("search-input");
//   const typeFilter = document.getElementById("type-filter");
//   const grid = document.getElementById("property-grid");
//   const cards = Array.from(grid.children);

//   function filterProperties() {
//     const query = searchInput.value.toLowerCase();
//     const type = typeFilter.value;

//     cards.forEach(card => {
//       const area = card.dataset.area || "";
//       const propertyType = card.dataset.type;

//       const matchesSearch = area.includes(query);
//       const matchesType = type === "all" || propertyType === type;

//       card.style.display = matchesSearch && matchesType ? "block" : "none";
//     });
//   }

//   searchInput.addEventListener("input", filterProperties);
//   typeFilter.addEventListener("change", filterProperties);
// });
