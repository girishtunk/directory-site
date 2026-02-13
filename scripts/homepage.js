document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const suggestionsList = document.getElementById("search-suggestions");
  const typeFilter = document.getElementById("type-filter");
  const sortFilter = document.getElementById("sort-filter");
  const priceMinInput = document.getElementById("price-min");
  const priceMaxInput = document.getElementById("price-max");
  const sqftMinInput = document.getElementById("sqft-min");
  const sqftMaxInput = document.getElementById("sqft-max");
  const priceMinRange = document.getElementById("price-min-range");
  const priceMaxRange = document.getElementById("price-max-range");
  const sqftMinRange = document.getElementById("sqft-min-range");
  const sqftMaxRange = document.getElementById("sqft-max-range");
  const advancedFilters = document.getElementById("advanced-filters");
  const toggleFiltersBtn = document.getElementById("toggle-filters");
  const clearFiltersBtn = document.getElementById("clear-filters");
  const activeFiltersContainer = document.getElementById("active-filters");
  const resultsCount = document.getElementById("results-count");
  const noResults = document.getElementById("no-results");
  const grid = document.getElementById("property-grid");
  const paginationContainer = document.getElementById("pagination");

  if (!searchInput || !typeFilter || !grid || !paginationContainer) return;

  const cards = Array.from(grid.children);
  const itemsPerPage = 9;
  let currentPage = 1;
  let filteredCards = [...cards];

  const searchableValues = cards
    .map((card) => (card.dataset.searchable || "").trim())
    .filter(Boolean);
  const uniqueTerms = [...new Set(searchableValues)];

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  const initialType = params.get("type") || "all";
  const initialSort = params.get("sort") || "recommended";
  const initialPriceMin = params.get("priceMin") || "";
  const initialPriceMax = params.get("priceMax") || "";
  const initialSqftMin = params.get("sqftMin") || "";
  const initialSqftMax = params.get("sqftMax") || "";

  const cardPrices = cards
    .map((card) => Number(card.dataset.price))
    .filter((value) => Number.isFinite(value));
  const cardSqft = cards
    .map((card) => Number(card.dataset.sqft))
    .filter((value) => Number.isFinite(value));
  const priceBounds = {
    min: cardPrices.length ? Math.floor(Math.min(...cardPrices)) : 0,
    max: cardPrices.length ? Math.ceil(Math.max(...cardPrices)) : 10,
  };
  const sqftBounds = {
    min: cardSqft.length ? Math.floor(Math.min(...cardSqft)) : 0,
    max: cardSqft.length ? Math.ceil(Math.max(...cardSqft)) : 10000,
  };

  searchInput.value = initialQuery;
  typeFilter.value = ["all", "apartment", "villa", "commercial", "independent-house"].includes(initialType)
    ? initialType
    : "all";
  if (sortFilter) {
    sortFilter.value = ["recommended", "price-low", "price-high", "area-high"].includes(initialSort)
      ? initialSort
      : "recommended";
  }
  if (priceMinInput) priceMinInput.value = initialPriceMin;
  if (priceMaxInput) priceMaxInput.value = initialPriceMax;
  if (sqftMinInput) sqftMinInput.value = initialSqftMin;
  if (sqftMaxInput) sqftMaxInput.value = initialSqftMax;

  if (priceMinRange && priceMaxRange) {
    priceMinRange.min = String(priceBounds.min);
    priceMinRange.max = String(priceBounds.max);
    priceMaxRange.min = String(priceBounds.min);
    priceMaxRange.max = String(priceBounds.max);
    priceMinRange.value = initialPriceMin || String(priceBounds.min);
    priceMaxRange.value = initialPriceMax || String(priceBounds.max);
  }
  if (sqftMinRange && sqftMaxRange) {
    sqftMinRange.min = String(sqftBounds.min);
    sqftMinRange.max = String(sqftBounds.max);
    sqftMaxRange.min = String(sqftBounds.min);
    sqftMaxRange.max = String(sqftBounds.max);
    sqftMinRange.value = initialSqftMin || String(sqftBounds.min);
    sqftMaxRange.value = initialSqftMax || String(sqftBounds.max);
  }

  if (priceMinInput && cardPrices.length) {
    priceMinInput.placeholder = `Min Price (Cr) e.g. ${Math.floor(Math.min(...cardPrices))}`;
  }
  if (priceMaxInput && cardPrices.length) {
    priceMaxInput.placeholder = `Max Price (Cr) e.g. ${Math.ceil(Math.max(...cardPrices))}`;
  }
  if (sqftMinInput && cardSqft.length) {
    sqftMinInput.placeholder = `Min Area (sqft) e.g. ${Math.floor(Math.min(...cardSqft))}`;
  }
  if (sqftMaxInput && cardSqft.length) {
    sqftMaxInput.placeholder = `Max Area (sqft) e.g. ${Math.ceil(Math.max(...cardSqft))}`;
  }

  function getNumberValue(inputEl) {
    if (!inputEl) return null;
    const raw = inputEl.value.trim();
    if (raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  function syncRangeFromInput(inputEl, rangeEl, fallbackValue) {
    if (!inputEl || !rangeEl) return;
    const value = getNumberValue(inputEl);
    rangeEl.value = String(value === null ? fallbackValue : value);
  }

  function setupRangePair(minRangeEl, maxRangeEl, minInputEl, maxInputEl) {
    if (!minRangeEl || !maxRangeEl || !minInputEl || !maxInputEl) return;

    minRangeEl.addEventListener("input", () => {
      if (Number(minRangeEl.value) > Number(maxRangeEl.value)) {
        maxRangeEl.value = minRangeEl.value;
      }
      minInputEl.value = minRangeEl.value;
      maxInputEl.value = maxRangeEl.value;
      filterProperties();
    });

    maxRangeEl.addEventListener("input", () => {
      if (Number(maxRangeEl.value) < Number(minRangeEl.value)) {
        minRangeEl.value = maxRangeEl.value;
      }
      minInputEl.value = minRangeEl.value;
      maxInputEl.value = maxRangeEl.value;
      filterProperties();
    });
  }

  function updateAdvancedVisibility() {
    if (!advancedFilters || !toggleFiltersBtn) return;
    const expanded = toggleFiltersBtn.getAttribute("aria-expanded") === "true";
    advancedFilters.hidden = !expanded;
    advancedFilters.classList.toggle("is-collapsed", !expanded);
    advancedFilters.classList.toggle("is-open", expanded);
    toggleFiltersBtn.textContent = expanded ? "Hide Filters" : "More Filters";
  }

  function updateUrlState() {
    const q = searchInput.value.trim();
    const type = typeFilter.value;
    const sort = sortFilter ? sortFilter.value : "recommended";
    const priceMin = getNumberValue(priceMinInput);
    const priceMax = getNumberValue(priceMaxInput);
    const sqftMin = getNumberValue(sqftMinInput);
    const sqftMax = getNumberValue(sqftMaxInput);
    const url = new URL(window.location.href);

    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");

    if (type && type !== "all") url.searchParams.set("type", type);
    else url.searchParams.delete("type");

    if (sort && sort !== "recommended") url.searchParams.set("sort", sort);
    else url.searchParams.delete("sort");

    if (priceMin !== null) url.searchParams.set("priceMin", String(priceMin));
    else url.searchParams.delete("priceMin");

    if (priceMax !== null) url.searchParams.set("priceMax", String(priceMax));
    else url.searchParams.delete("priceMax");

    if (sqftMin !== null) url.searchParams.set("sqftMin", String(sqftMin));
    else url.searchParams.delete("sqftMin");

    if (sqftMax !== null) url.searchParams.set("sqftMax", String(sqftMax));
    else url.searchParams.delete("sqftMax");

    window.history.replaceState({}, "", url);
  }

  function updateResultMeta() {
    if (resultsCount) {
      const typeLabel = typeFilter.value === "all" ? "all property types" : typeFilter.value.replace("-", " ");
      resultsCount.textContent = `${filteredCards.length} result(s) for ${typeLabel}`;
    }

    if (noResults) {
      noResults.hidden = filteredCards.length > 0;
    }
  }

  function renderActiveFilters() {
    if (!activeFiltersContainer) return;

    const chips = [];
    const q = searchInput.value.trim();
    const type = typeFilter.value;
    const sort = sortFilter ? sortFilter.value : "recommended";
    const minPrice = getNumberValue(priceMinInput);
    const maxPrice = getNumberValue(priceMaxInput);
    const minSqft = getNumberValue(sqftMinInput);
    const maxSqft = getNumberValue(sqftMaxInput);

    if (q) {
      chips.push({ label: `Search: ${q}`, key: "q" });
    }
    if (type !== "all") {
      chips.push({ label: `Type: ${type.replace("-", " ")}`, key: "type" });
    }
    if (sort !== "recommended") {
      chips.push({ label: `Sort: ${sort.replace("-", " ")}`, key: "sort" });
    }
    if (minPrice !== null || maxPrice !== null) {
      chips.push({
        label: `Price: ${minPrice !== null ? minPrice : "Any"} - ${maxPrice !== null ? maxPrice : "Any"} Cr`,
        key: "price",
      });
    }
    if (minSqft !== null || maxSqft !== null) {
      chips.push({
        label: `Area: ${minSqft !== null ? minSqft : "Any"} - ${maxSqft !== null ? maxSqft : "Any"} sqft`,
        key: "sqft",
      });
    }

    if (!chips.length) {
      activeFiltersContainer.innerHTML = "";
      activeFiltersContainer.hidden = true;
      return;
    }

    activeFiltersContainer.hidden = false;
    activeFiltersContainer.innerHTML = chips
      .map(
        (chip) =>
          `<button type="button" class="filter-chip" data-remove="${chip.key}" aria-label="Remove ${chip.label}">${chip.label}<span class="chip-x">x</span></button>`,
      )
      .join("");
  }

  function showPage(page = 1) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    cards.forEach((card) => {
      card.style.display = "none";
    });

    filteredCards.slice(start, end).forEach((card) => {
      card.style.display = "";
    });
  }

  function renderPagination() {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(i);
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

  function filterProperties() {
    const query = searchInput.value.toLowerCase().trim();
    const selectedType = typeFilter.value;
    const minPrice = getNumberValue(priceMinInput);
    const maxPrice = getNumberValue(priceMaxInput);
    const minSqft = getNumberValue(sqftMinInput);
    const maxSqft = getNumberValue(sqftMaxInput);

    filteredCards = cards.filter((card) => {
      const searchable = card.dataset.searchable || "";
      const propertyType = card.dataset.type || "";
      const price = Number(card.dataset.price);
      const sqft = Number(card.dataset.sqft);
      const matchesQuery = !query || searchable.includes(query);
      const matchesType = selectedType === "all" || propertyType === selectedType;
      const matchesMinPrice = minPrice === null || (Number.isFinite(price) && price >= minPrice);
      const matchesMaxPrice = maxPrice === null || (Number.isFinite(price) && price <= maxPrice);
      const matchesMinSqft = minSqft === null || (Number.isFinite(sqft) && sqft >= minSqft);
      const matchesMaxSqft = maxSqft === null || (Number.isFinite(sqft) && sqft <= maxSqft);

      return (
        matchesQuery &&
        matchesType &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinSqft &&
        matchesMaxSqft
      );
    });

    if (sortFilter) {
      const sort = sortFilter.value;
      if (sort === "price-low") {
        filteredCards.sort((a, b) => Number(a.dataset.price || 0) - Number(b.dataset.price || 0));
      } else if (sort === "price-high") {
        filteredCards.sort((a, b) => Number(b.dataset.price || 0) - Number(a.dataset.price || 0));
      } else if (sort === "area-high") {
        filteredCards.sort((a, b) => Number(b.dataset.sqft || 0) - Number(a.dataset.sqft || 0));
      }
    }

    currentPage = 1;
    showPage(currentPage);
    renderPagination();
    updateResultMeta();
    renderActiveFilters();
    updateUrlState();
  }

  function showSuggestions(query) {
    suggestionsList.innerHTML = "";
    const normalized = query.toLowerCase().trim();

    if (!normalized) return;

    const matched = uniqueTerms
      .filter((term) => term.includes(normalized))
      .slice(0, 6);

    matched.forEach((term) => {
      const li = document.createElement("li");
      li.textContent = term;
      li.setAttribute("role", "option");
      li.addEventListener("click", () => {
        searchInput.value = term;
        suggestionsList.innerHTML = "";
        filterProperties();
      });
      suggestionsList.appendChild(li);
    });
  }

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value;
    filterProperties();
    showSuggestions(query);
  });

  typeFilter.addEventListener("change", () => {
    filterProperties();
  });
  if (sortFilter) {
    sortFilter.addEventListener("change", () => {
      filterProperties();
    });
  }

  [priceMinInput, priceMaxInput, sqftMinInput, sqftMaxInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      syncRangeFromInput(priceMinInput, priceMinRange, priceBounds.min);
      syncRangeFromInput(priceMaxInput, priceMaxRange, priceBounds.max);
      syncRangeFromInput(sqftMinInput, sqftMinRange, sqftBounds.min);
      syncRangeFromInput(sqftMaxInput, sqftMaxRange, sqftBounds.max);
      filterProperties();
    });
  });

  setupRangePair(priceMinRange, priceMaxRange, priceMinInput, priceMaxInput);
  setupRangePair(sqftMinRange, sqftMaxRange, sqftMinInput, sqftMaxInput);

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      searchInput.value = "";
      typeFilter.value = "all";
      if (sortFilter) sortFilter.value = "recommended";
      if (priceMinInput) priceMinInput.value = "";
      if (priceMaxInput) priceMaxInput.value = "";
      if (sqftMinInput) sqftMinInput.value = "";
      if (sqftMaxInput) sqftMaxInput.value = "";
      if (priceMinRange) priceMinRange.value = String(priceBounds.min);
      if (priceMaxRange) priceMaxRange.value = String(priceBounds.max);
      if (sqftMinRange) sqftMinRange.value = String(sqftBounds.min);
      if (sqftMaxRange) sqftMaxRange.value = String(sqftBounds.max);
      suggestionsList.innerHTML = "";
      filterProperties();
    });
  }

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.innerHTML = "";
    }
  });

  if (activeFiltersContainer) {
    activeFiltersContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove]");
      if (!btn) return;
      const key = btn.dataset.remove;

      if (key === "q") searchInput.value = "";
      if (key === "type") typeFilter.value = "all";
      if (key === "sort" && sortFilter) sortFilter.value = "recommended";
      if (key === "price") {
        if (priceMinInput) priceMinInput.value = "";
        if (priceMaxInput) priceMaxInput.value = "";
        if (priceMinRange) priceMinRange.value = String(priceBounds.min);
        if (priceMaxRange) priceMaxRange.value = String(priceBounds.max);
      }
      if (key === "sqft") {
        if (sqftMinInput) sqftMinInput.value = "";
        if (sqftMaxInput) sqftMaxInput.value = "";
        if (sqftMinRange) sqftMinRange.value = String(sqftBounds.min);
        if (sqftMaxRange) sqftMaxRange.value = String(sqftBounds.max);
      }

      filterProperties();
    });
  }

  if (toggleFiltersBtn) {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    toggleFiltersBtn.setAttribute("aria-expanded", isMobile ? "false" : "true");

    toggleFiltersBtn.addEventListener("click", () => {
      const expanded = toggleFiltersBtn.getAttribute("aria-expanded") === "true";
      toggleFiltersBtn.setAttribute("aria-expanded", expanded ? "false" : "true");
      updateAdvancedVisibility();
    });
  }

  updateAdvancedVisibility();
  filterProperties();
});
