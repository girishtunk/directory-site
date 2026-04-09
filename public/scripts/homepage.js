document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const suggestionsList = document.getElementById("search-suggestions");
  const clearSearchButton = document.getElementById("clear-search");
  const resetFiltersButton = document.getElementById("reset-filters");
  const emptyResetButton = document.getElementById("empty-reset-filters");
  const typeFilter = document.getElementById("type-filter");
  const grid = document.getElementById("property-grid");
  const resultsSummary = document.getElementById("results-summary");
  const activeFilters = document.getElementById("active-filters");
  const emptyState = document.getElementById("empty-state");
  const cards = Array.from(grid.children);
  const paginationContainer = document.getElementById("pagination");

  const itemsPerPage = 9;
  let currentPage = 1;
  let filteredCards = [...cards];
  const params = new URLSearchParams(window.location.search);
  const initialArea = params.get("area") || "";
  const initialType = params.get("type") || "all";

  // Prepare dataset for autocomplete
  const areas = cards.map((card) => card.dataset.area).filter(Boolean);
  const uniqueAreas = [...new Set(areas)].sort();

  function updateUrl(query, type) {
    const nextParams = new URLSearchParams();

    if (query) {
      nextParams.set("area", query);
    }

    if (type && type !== "all") {
      nextParams.set("type", type);
    }

    const nextUrl = nextParams.toString()
      ? `${window.location.pathname}?${nextParams.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, "", nextUrl);
  }

  function updateSearchUi(query, type) {
    const hasQuery = Boolean(query.trim());
    const hasType = type !== "all";
    clearSearchButton.hidden = !hasQuery;

    const labels = [];

    if (hasQuery) {
      labels.push(`Area: ${query}`);
    }

    if (hasType) {
      const selectedOption = typeFilter.options[typeFilter.selectedIndex];
      labels.push(`Type: ${selectedOption.textContent}`);
    }

    activeFilters.innerHTML = labels.length
      ? labels.map((label) => `<span class="filter-pill">${label}</span>`).join("")
      : "<span class=\"filter-pill filter-pill-muted\">Showing all listings</span>";

    const totalMatches = filteredCards.length;
    resultsSummary.textContent = `${totalMatches} ${totalMatches === 1 ? "property" : "properties"} found`;
    emptyState.hidden = totalMatches !== 0;
    paginationContainer.hidden = totalMatches === 0;
    grid.hidden = totalMatches === 0;
  }

  function filterProperties(query = "") {
    const type = typeFilter.value;
    const normalizedQuery = query.trim().toLowerCase();

    filteredCards = cards.filter((card) => {
      const area = card.dataset.area || "";
      const propertyType = card.dataset.type;
      const matchesSearch = area.includes(normalizedQuery);
      const matchesType = type === "all" || propertyType === type;
      return matchesSearch && matchesType;
    });

    currentPage = 1;
    showPage(currentPage);
    renderPagination();
    updateSearchUi(query, type);
    updateUrl(query.trim(), type);
  }

  function showPage(page = 1) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    cards.forEach((card) => (card.style.display = "none"));
    filteredCards.slice(start, end).forEach((card) => (card.style.display = "block"));
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
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      paginationContainer.appendChild(btn);
    }
  }

  function showSuggestions(query) {
    suggestionsList.innerHTML = "";
    if (!query.trim()) return;

    const matched = uniqueAreas
      .filter((area) => area.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);

    if (!matched.length) {
      const li = document.createElement("li");
      li.className = "suggestion-empty";
      li.textContent = "No matching areas";
      suggestionsList.appendChild(li);
      return;
    }

    matched.forEach((area) => {
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

  function resetFilters() {
    searchInput.value = "";
    typeFilter.value = "all";
    suggestionsList.innerHTML = "";
    filterProperties("");
  }

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value;
    filterProperties(query);
    showSuggestions(query);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const firstSuggestion = suggestionsList.querySelector("li:not(.suggestion-empty)");
      if (firstSuggestion) {
        firstSuggestion.click();
      }
    }
  });

  typeFilter.addEventListener("change", () => filterProperties(searchInput.value));

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    suggestionsList.innerHTML = "";
    filterProperties("");
  });

  resetFiltersButton.addEventListener("click", resetFilters);
  emptyResetButton.addEventListener("click", resetFilters);

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.innerHTML = "";
    }
  });

  if (initialArea) {
    searchInput.value = initialArea;
  }

  if ([...typeFilter.options].some((option) => option.value === initialType)) {
    typeFilter.value = initialType;
  }

  filterProperties(initialArea);
  showSuggestions(initialArea);
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
