import { useState, useEffect } from "react";
import { useLanguage } from "./context/LanguageContext";
import { productAPI } from "./services/api";
import "./SearchAndFilter.css";

const SearchAndFilter = ({ onSearch }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [categories, setCategories] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await productAPI.getCategories();
      setCategories(cats || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const params = {
        searchTerm: searchTerm.trim() || null,
        category: category || null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        sortBy,
        sortOrder,
      };

      const results = await productAPI.searchAndFilter(params);

      // Announce search results for voice guidance
      if (window.voiceGuidance && window.voiceGuidance.isEnabled()) {
        const resultCount = results.length;
        if (resultCount > 0) {
          window.voiceGuidance.announceSuccess(`${resultCount} ${t("searchResults")}`);
        } else {
          window.voiceGuidance.announceAction(t("noResults"));
        }
      }

      onSearch(results);
    } catch (error) {
      console.error("Search error:", error);
      if (window.voiceGuidance && window.voiceGuidance.isEnabled()) {
        window.voiceGuidance.announceError(t("errorOccurred"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setSearchTerm("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("createdAt");
    setSortOrder("desc");
    // Search with cleared params directly (avoids stale state closure)
    setIsLoading(true);
    try {
      const results = await productAPI.searchAndFilter({ sortBy: "createdAt", sortOrder: "desc" });
      onSearch(results);
    } catch (error) {
      console.error("Clear filters search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="search-filter-container">
      {/* Search Bar */}
      <div className="search-bar">
        <div className="search-input-group">
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="search-button"
          >
            {isLoading ? t("searching") : t("searchLabel")}
          </button>
        </div>

        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`filter-toggle ${isFilterOpen ? "active" : ""}`}
        >
          {t("filterLabel")}
        </button>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="filter-panel">
          <div className="filter-row">
            {/* Category Filter */}
            <div className="filter-group">
              <label>{t("categoryLabel")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">{t("allCategories")}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <label>{t("priceRange")}</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder={t("minPrice")}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="price-input"
                  min="0"
                  step="0.01"
                />
                <span className="price-separator">-</span>
                <input
                  type="number"
                  placeholder={t("maxPrice")}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="price-input"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="filter-row">
            {/* Sort By */}
            <div className="filter-group">
              <label>{t("sortBy")}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="createdAt">{t("newestFirst")}</option>
                <option value="price">{t("priceLowToHigh")}</option>
                <option value="name">{t("nameAZ")}</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="filter-group">
              <label>{t("sortOrder")}</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="filter-select"
              >
                <option value="desc">{t("newestFirst")}</option>
                <option value="asc">{t("oldestFirst")}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="filter-actions">
            <button
              onClick={handleClearFilters}
              className="clear-filters-btn"
            >
              {t("clearFilters")}
            </button>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="apply-filters-btn"
            >
              {t("applyFilters")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;