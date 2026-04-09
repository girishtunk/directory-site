document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const suggestionsList = document.getElementById("search-suggestions");
  const clearSearchButton = document.getElementById("clear-search");
  const resetFiltersButton = document.getElementById("reset-filters");
  const emptyResetButton = document.getElementById("empty-reset-filters");
  const areaFilter = document.getElementById("area-filter");
  const typeFilter = document.getElementById("type-filter");
  const priceFilter = document.getElementById("price-filter");
  const facingFilter = document.getElementById("facing-filter");
  const dealFilter = document.getElementById("deal-filter");
  const sortFilter = document.getElementById("sort-filter");
  const areaChips = Array.from(document.querySelectorAll("[data-area-chip]"));
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
  const initialArea = params.get("area") || "all";
  const initialType = params.get("type") || "all";
  const initialSearch = params.get("q") || "";
  const initialPrice = params.get("price") || "all";
  const initialFacing = params.get("facing") || "all";
  const initialDeal = params.get("deal") || "all";
  const initialSort = params.get("sort") || "recommended";

  const areas = cards.map((card) => card.dataset.areaName).filter(Boolean);
  const uniqueAreas = [...new Set(areas)].sort();

  function updateAreaChipState(selectedArea) {
    areaChips.forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.areaChip === selectedArea && selectedArea !== "all");
    });
  }

  function updateUrl(state) {
    const nextParams = new URLSearchParams();

    if (state.query) {
      nextParams.set("q", state.query);
    }

    if (state.area !== "all") {
      nextParams.set("area", state.area);
    }

    if (state.type !== "all") {
      nextParams.set("type", state.type);
    }

    if (state.price !== "all") {
      nextParams.set("price", state.price);
    }

    if (state.facing !== "all") {
      nextParams.set("facing", state.facing);
    }

    if (state.deal !== "all") {
      nextParams.set("deal", state.deal);
    }

    if (state.sort !== "recommended") {
      nextParams.set("sort", state.sort);
    }

    const nextUrl = nextParams.toString()
      ? `${window.location.pathname}?${nextParams.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, "", nextUrl);
  }

  function matchesPriceBand(price, band) {
    if (band === "all") {
      return true;
    }

    if (!price || Number.isNaN(price)) {
      return false;
    }

    if (band === "under-3") {
      return price < 3;
    }

    if (band === "3-5") {
      return price >= 3 && price <= 5;
    }

    if (band === "5-10") {
      return price > 5 && price <= 10;
    }

    if (band === "10-plus") {
      return price > 10;
    }

    return true;
  }

  function sortCards(list, sortValue) {
    return [...list].sort((leftCard, rightCard) => {
      const leftPrice = Number(leftCard.dataset.price) || 0;
      const rightPrice = Number(rightCard.dataset.price) || 0;
      const leftArea = leftCard.dataset.areaName || "";
      const rightArea = rightCard.dataset.areaName || "";
      const leftFeatured = leftCard.dataset.featured === "true" ? 1 : 0;
      const rightFeatured = rightCard.dataset.featured === "true" ? 1 : 0;
      const leftInvestor = leftCard.dataset.investor === "true" ? 1 : 0;
      const rightInvestor = rightCard.dataset.investor === "true" ? 1 : 0;

      if (sortValue === "price-low") {
        return leftPrice - rightPrice;
      }

      if (sortValue === "price-high") {
        return rightPrice - leftPrice;
      }

      if (sortValue === "area-az") {
        return leftArea.localeCompare(rightArea);
      }

      if (rightFeatured !== leftFeatured) {
        return rightFeatured - leftFeatured;
      }

      if (rightInvestor !== leftInvestor) {
        return rightInvestor - leftInvestor;
      }

      return leftPrice - rightPrice;
    });
  }

  function getState() {
    return {
      query: searchInput.value.trim(),
      area: areaFilter.value,
      type: typeFilter.value,
      price: priceFilter.value,
      facing: facingFilter.value,
      deal: dealFilter.value,
      sort: sortFilter.value,
    };
  }

  function updateSearchUi(state) {
    const hasQuery = Boolean(state.query);
    clearSearchButton.hidden = !hasQuery;

    const labels = [];

    if (hasQuery) {
      labels.push(`Search: ${state.query}`);
    }

    if (state.area !== "all") {
      labels.push(`Area: ${state.area}`);
    }

    if (state.type !== "all") {
      labels.push(`Type: ${typeFilter.options[typeFilter.selectedIndex].textContent}`);
    }

    if (state.price !== "all") {
      labels.push(`Budget: ${priceFilter.options[priceFilter.selectedIndex].textContent}`);
    }

    if (state.facing !== "all") {
      labels.push(`Facing: ${state.facing}`);
    }

    if (state.deal !== "all") {
      labels.push(`Deal: ${dealFilter.options[dealFilter.selectedIndex].textContent}`);
    }

    activeFilters.innerHTML = labels.length
      ? labels.map((label) => `<span class="filter-pill">${label}</span>`).join("")
      : '<span class="filter-pill filter-pill-muted">Showing all listings</span>';

    const totalMatches = filteredCards.length;
    resultsSummary.textContent = `${totalMatches} ${totalMatches === 1 ? "property" : "properties"} found`;
    emptyState.hidden = totalMatches !== 0;
    paginationContainer.hidden = totalMatches === 0;
    grid.hidden = totalMatches === 0;
    updateAreaChipState(state.area);
  }

  function filterProperties() {
    const state = getState();
    const normalizedQuery = state.query.toLowerCase();

    filteredCards = cards.filter((card) => {
      const searchableText = card.dataset.search || "";
      const area = card.dataset.areaName || "";
      const propertyType = card.dataset.type;
      const facing = card.dataset.facing || "";
      const price = Number(card.dataset.price);
      const isFeatured = card.dataset.featured === "true";
      const isInvestor = card.dataset.investor === "true";

      const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesArea = state.area === "all" || area === state.area;
      const matchesType = state.type === "all" || propertyType === state.type;
      const matchesPrice = matchesPriceBand(price, state.price);
      const matchesFacing = state.facing === "all" || facing === state.facing;
      const matchesDeal =
        state.deal === "all" ||
        (state.deal === "featured" && isFeatured) ||
        (state.deal === "investor" && isInvestor);

      return matchesSearch && matchesArea && matchesType && matchesPrice && matchesFacing && matchesDeal;
    });

    filteredCards = sortCards(filteredCards, state.sort);

    currentPage = 1;
    showPage(currentPage);
    renderPagination();
    updateSearchUi(state);
    updateUrl(state);
  }

  function showPage(page = 1) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    cards.forEach((card) => {
      card.style.display = "none";
    });

    filteredCards.forEach((card) => {
      grid.appendChild(card);
    });

    filteredCards.slice(start, end).forEach((card) => {
      card.style.display = "flex";
    });
  }

  function renderPagination() {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i += 1) {
      const button = document.createElement("button");
      button.textContent = i;

      if (i === currentPage) {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {
        currentPage = i;
        showPage(currentPage);
        renderPagination();
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      paginationContainer.appendChild(button);
    }
  }

  function showSuggestions(query) {
    suggestionsList.innerHTML = "";

    if (!query.trim()) {
      return;
    }

    const matched = uniqueAreas
      .filter((area) => area.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);

    if (!matched.length) {
      const item = document.createElement("li");
      item.className = "suggestion-empty";
      item.textContent = "No matching areas";
      suggestionsList.appendChild(item);
      return;
    }

    matched.forEach((area) => {
      const item = document.createElement("li");
      item.textContent = area;
      item.addEventListener("click", () => {
        areaFilter.value = area;
        searchInput.value = "";
        suggestionsList.innerHTML = "";
        filterProperties();
      });
      suggestionsList.appendChild(item);
    });
  }

  function resetFilters() {
    searchInput.value = "";
    areaFilter.value = "all";
    typeFilter.value = "all";
    priceFilter.value = "all";
    facingFilter.value = "all";
    dealFilter.value = "all";
    sortFilter.value = "recommended";
    suggestionsList.innerHTML = "";
    filterProperties();
  }

  searchInput.addEventListener("input", (event) => {
    areaFilter.value = "all";
    filterProperties();
    showSuggestions(event.target.value);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const firstSuggestion = suggestionsList.querySelector("li:not(.suggestion-empty)");

      if (firstSuggestion) {
        firstSuggestion.click();
      }
    }
  });

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    suggestionsList.innerHTML = "";
    filterProperties();
  });

  areaFilter.addEventListener("change", () => {
    suggestionsList.innerHTML = "";
    filterProperties();
  });

  typeFilter.addEventListener("change", filterProperties);
  priceFilter.addEventListener("change", filterProperties);
  facingFilter.addEventListener("change", filterProperties);
  dealFilter.addEventListener("change", filterProperties);
  sortFilter.addEventListener("change", filterProperties);
  resetFiltersButton.addEventListener("click", resetFilters);
  emptyResetButton.addEventListener("click", resetFilters);

  areaChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      areaFilter.value = chip.dataset.areaChip;
      searchInput.value = "";
      suggestionsList.innerHTML = "";
      filterProperties();
    });
  });

  document.addEventListener("click", (event) => {
    if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
      suggestionsList.innerHTML = "";
    }
  });

  if (initialSearch) {
    searchInput.value = initialSearch;
  }

  if ([...areaFilter.options].some((option) => option.value === initialArea)) {
    areaFilter.value = initialArea;
  }

  if ([...typeFilter.options].some((option) => option.value === initialType)) {
    typeFilter.value = initialType;
  }

  if ([...priceFilter.options].some((option) => option.value === initialPrice)) {
    priceFilter.value = initialPrice;
  }

  if ([...facingFilter.options].some((option) => option.value === initialFacing)) {
    facingFilter.value = initialFacing;
  }

  if ([...dealFilter.options].some((option) => option.value === initialDeal)) {
    dealFilter.value = initialDeal;
  }

  if ([...sortFilter.options].some((option) => option.value === initialSort)) {
    sortFilter.value = initialSort;
  }

  filterProperties();
});
