document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const suggestionsList = document.getElementById("search-suggestions");
  const clearSearchButton = document.getElementById("clear-search");
  const toggleAdvancedFiltersButton = document.getElementById("toggle-advanced-filters");
  const advancedFilters = document.getElementById("advanced-filters");
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
  const initialFacing = (params.get("facing") || "all").toLowerCase();
  const initialDeal = params.get("deal") || "all";
  const initialSort = params.get("sort") || "recommended";
  const hasAdvancedParams = [initialArea, initialType, initialPrice, initialFacing, initialDeal, initialSort]
    .some((value, index) => ["all", "all", "all", "all", "all", "recommended"][index] !== value);

  const areas = cards.map((card) => card.dataset.areaName).filter(Boolean);
  const uniqueAreas = [...new Set(areas)].sort();
  const searchSuggestions = [
    ...new Set(
      cards.flatMap((card) => [
        card.dataset.areaName,
        card.dataset.locality,
        card.dataset.landmark,
        card.dataset.title,
      ])
    ),
  ]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  function setAdvancedFiltersVisibility(expanded) {
    advancedFilters.hidden = !expanded;
    toggleAdvancedFiltersButton.setAttribute("aria-expanded", String(expanded));
    toggleAdvancedFiltersButton.textContent = expanded
      ? "Hide Advanced Filters"
      : "Show Advanced Filters";
  }

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
      labels.push(`Facing: ${facingFilter.options[facingFilter.selectedIndex].textContent}`);
    }

    if (state.deal !== "all") {
      labels.push(`Deal: ${dealFilter.options[dealFilter.selectedIndex].textContent}`);
    }

    const filterLabels = labels.length ? labels : ["Showing all listings"];
    const pills = filterLabels.map((label) => {
      const pill = document.createElement("span");
      pill.className = `filter-pill${labels.length ? "" : " filter-pill-muted"}`;
      pill.textContent = label;
      return pill;
    });
    activeFilters.replaceChildren(...pills);

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
      const facings = (card.dataset.facing || "")
        .split(/[,/]+/)
        .map((value) => value.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean);
      const price = Number(card.dataset.price);
      const isFeatured = card.dataset.featured === "true";
      const isInvestor = card.dataset.investor === "true";

      const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesArea = state.area === "all" || area === state.area;
      const matchesType = state.type === "all" || propertyType === state.type;
      const matchesPrice = matchesPriceBand(price, state.price);
      const matchesFacing = state.facing === "all" || facings.includes(state.facing);
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

    if (totalPages <= 1) {
      return;
    }

    const pages = getVisiblePages(totalPages, currentPage);

    paginationContainer.appendChild(createPaginationButton("Prev", currentPage - 1, currentPage === 1));

    pages.forEach((page) => {
      if (page === "...") {
        const ellipsis = document.createElement("span");
        ellipsis.className = "pagination-ellipsis";
        ellipsis.textContent = "...";
        paginationContainer.appendChild(ellipsis);
        return;
      }

      paginationContainer.appendChild(createPaginationButton(String(page), page, false, page === currentPage));
    });

    paginationContainer.appendChild(
      createPaginationButton("Next", currentPage + 1, currentPage === totalPages)
    );
  }

  function getVisiblePages(totalPages, page) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (page <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (page >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  }

  function createPaginationButton(label, page, disabled = false, active = false) {
    const button = document.createElement("button");
    button.textContent = label;
    button.disabled = disabled;

    if (active) {
      button.classList.add("active");
      button.setAttribute("aria-current", "page");
    }

    button.addEventListener("click", () => {
      if (disabled || page === currentPage) {
        return;
      }

      currentPage = page;
      showPage(currentPage);
      renderPagination();
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return button;
  }

  function showSuggestions(query) {
    suggestionsList.innerHTML = "";

    if (!query.trim()) {
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const matched = searchSuggestions
      .filter((value) => value.toLowerCase().includes(normalizedQuery))
      .slice(0, 6);

    if (!matched.length) {
      const item = document.createElement("li");
      item.className = "suggestion-empty";
      item.textContent = "No matching suggestions";
      suggestionsList.appendChild(item);
      return;
    }

    matched.forEach((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      item.addEventListener("click", () => {
        searchInput.value = value;
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
      suggestionsList.innerHTML = "";
      filterProperties();
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
  toggleAdvancedFiltersButton.addEventListener("click", () => {
    setAdvancedFiltersVisibility(advancedFilters.hidden);
  });

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

  setAdvancedFiltersVisibility(hasAdvancedParams);
  filterProperties();
});
