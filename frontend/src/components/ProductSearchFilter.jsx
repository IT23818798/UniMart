import React, { useEffect, useMemo, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaFilter, FaHistory, FaSave, FaSearch, FaSortAmountDown, FaTimes } from 'react-icons/fa';
import { filterProducts, sortProducts, tokenizeSearchTerm } from '../utils/productFilterUtils';

const STORAGE_KEYS = {
  history: 'product-search-filter:history',
  presets: 'product-search-filter:presets',
  lastState: 'product-search-filter:last-state'
};

const DEFAULT_FILTERS = {
  searchTerm: '',
  category: 'all',
  subcategory: 'all',
  priceMin: '',
  priceMax: '',
  condition: [],
  availability: [],
  location: [],
  tags: [],
  sort: 'relevance',
  page: 1,
  pageSize: 12
};

const CONDITION_OPTIONS = [
  { label: 'new', value: 'new' },
  { label: 'used', value: 'used' },
  { label: 'like new', value: 'like_new' }
];

const AVAILABILITY_OPTIONS = [
  { label: 'in stock', value: 'in_stock' },
  { label: 'sold', value: 'sold' },
  { label: 'reserved', value: 'reserved' }
];

const ProductSearchFilter = ({
  products = [],
  onFilteredProductsChange,
  children,
  initialPageSize = 12,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(DEFAULT_FILTERS.searchTerm);
  const [category, setCategory] = useState(DEFAULT_FILTERS.category);
  const [subcategory, setSubcategory] = useState(DEFAULT_FILTERS.subcategory);
  const [priceMin, setPriceMin] = useState(DEFAULT_FILTERS.priceMin);
  const [priceMax, setPriceMax] = useState(DEFAULT_FILTERS.priceMax);
  const [condition, setCondition] = useState(DEFAULT_FILTERS.condition);
  const [availability, setAvailability] = useState(DEFAULT_FILTERS.availability);
  const [location, setLocation] = useState(DEFAULT_FILTERS.location);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(DEFAULT_FILTERS.tags);
  const [sort, setSort] = useState(DEFAULT_FILTERS.sort);
  const [page, setPage] = useState(DEFAULT_FILTERS.page);
  const [pageSize, setPageSize] = useState(initialPageSize || DEFAULT_FILTERS.pageSize);
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedPresets, setSavedPresets] = useState([]);

  const categories = useMemo(() => {
    const values = new Set();
    products.forEach((p) => p?.category && values.add(String(p.category)));
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const subcategories = useMemo(() => {
    const values = new Set();
    products.forEach((p) => {
      const value = p?.subcategory || p?.subCategory;
      if (value) values.add(String(value));
    });
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const locations = useMemo(() => {
    const values = new Set();
    products.forEach((p) => {
      const loc = p?.location?.city || p?.location?.address || p?.location || p?.seller?.address || p?.seller?.location;
      if (loc) values.add(String(loc));
    });
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]');
      const presets = JSON.parse(localStorage.getItem(STORAGE_KEYS.presets) || '[]');
      const lastState = JSON.parse(localStorage.getItem(STORAGE_KEYS.lastState) || '{}');

      if (Array.isArray(savedHistory)) setSearchHistory(savedHistory);
      if (Array.isArray(presets)) setSavedPresets(presets);

      if (lastState && typeof lastState === 'object') {
        setSearchTerm(lastState.searchTerm ?? DEFAULT_FILTERS.searchTerm);
        setCategory(lastState.category ?? DEFAULT_FILTERS.category);
        setSubcategory(lastState.subcategory ?? DEFAULT_FILTERS.subcategory);
        setPriceMin(lastState.priceMin ?? DEFAULT_FILTERS.priceMin);
        setPriceMax(lastState.priceMax ?? DEFAULT_FILTERS.priceMax);
        setCondition(Array.isArray(lastState.condition) ? lastState.condition : DEFAULT_FILTERS.condition);
        setAvailability(Array.isArray(lastState.availability) ? lastState.availability : DEFAULT_FILTERS.availability);
        setLocation(Array.isArray(lastState.location) ? lastState.location : DEFAULT_FILTERS.location);
        setTags(Array.isArray(lastState.tags) ? lastState.tags : DEFAULT_FILTERS.tags);
        setSort(lastState.sort ?? DEFAULT_FILTERS.sort);
        setPage(lastState.page ?? DEFAULT_FILTERS.page);
        setPageSize(lastState.pageSize ?? initialPageSize ?? DEFAULT_FILTERS.pageSize);
      }
    } catch (error) {
      console.error('Failed loading product search filters from localStorage:', error);
    }
  }, [initialPageSize]);

  useEffect(() => {
    const snapshot = {
      searchTerm,
      category,
      subcategory,
      priceMin,
      priceMax,
      condition,
      availability,
      location,
      tags,
      sort,
      page,
      pageSize
    };

    localStorage.setItem(STORAGE_KEYS.lastState, JSON.stringify(snapshot));
  }, [searchTerm, category, subcategory, priceMin, priceMax, condition, availability, location, tags, sort, page, pageSize]);

  const searchTokens = useMemo(() => {
    return tokenizeSearchTerm(searchTerm);
  }, [searchTerm]);

  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(
      products,
      {
        category,
        subcategory,
        priceMin,
        priceMax,
        condition,
        availability,
        location,
        tags
      },
      searchTokens
    );

    return sortProducts(filtered, sort);
  }, [products, searchTokens, category, subcategory, priceMin, priceMax, condition, availability, location, tags, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const clampedPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== clampedPage) {
      setPage(clampedPage);
    }
  }, [page, clampedPage]);

  const paginatedProducts = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, clampedPage, pageSize]);

  useEffect(() => {
    if (!onFilteredProductsChange) return;

    onFilteredProductsChange({
      filteredProducts,
      paginatedProducts,
      pagination: {
        page: clampedPage,
        pageSize,
        totalItems: filteredProducts.length,
        totalPages
      },
      filters: {
        searchTerm,
        category,
        subcategory,
        priceMin,
        priceMax,
        condition,
        availability,
        location,
        tags,
        sort
      }
    });
  }, [onFilteredProductsChange, filteredProducts, paginatedProducts, clampedPage, pageSize, totalPages, searchTerm, category, subcategory, priceMin, priceMax, condition, availability, location, tags, sort]);

  const commitSearchToHistory = (term) => {
    const nextTerm = term.trim();
    if (!nextTerm) return;

    const nextHistory = [nextTerm, ...searchHistory.filter((item) => item.toLowerCase() !== nextTerm.toLowerCase())].slice(0, 10);
    setSearchHistory(nextHistory);
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(nextHistory));
  };

  const addTag = (rawTag) => {
    const nextTag = rawTag.trim();
    if (!nextTag) return;
    if (tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) return;

    setTags((prev) => [...prev, nextTag]);
    setTagInput('');
    setPage(1);
  };

  const toggleFromList = (value, setListState) => {
    setListState((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
    setPage(1);
  };

  const maxDetectedPrice = useMemo(() => {
    if (!products.length) return 50000;
    const maxValue = products.reduce((max, item) => Math.max(max, Number(item?.price || 0)), 0);
    return Math.max(100, Math.ceil(maxValue / 50) * 50);
  }, [products]);

  const sliderMin = Number(priceMin || 0);
  const sliderMax = Number(priceMax || maxDetectedPrice);
  const visibleLocations = locations.filter((item) => item !== 'all').slice(0, 8);

  const popularTags = useMemo(() => {
    const discovered = new Set();
    products.forEach((product) => {
      (product?.tags || []).forEach((tag) => {
        if (tag) discovered.add(String(tag).toLowerCase());
      });
    });

    const fallback = ['textbooks', 'electronics', 'bestseller', 'stationery', 'accessories', 'studentdeal'];
    const source = discovered.size > 0 ? Array.from(discovered) : fallback;
    return source.slice(0, 8);
  }, [products]);

  const clearAllFilters = () => {
    setSearchTerm(DEFAULT_FILTERS.searchTerm);
    setCategory(DEFAULT_FILTERS.category);
    setSubcategory(DEFAULT_FILTERS.subcategory);
    setPriceMin(DEFAULT_FILTERS.priceMin);
    setPriceMax(DEFAULT_FILTERS.priceMax);
    setCondition(DEFAULT_FILTERS.condition);
    setAvailability(DEFAULT_FILTERS.availability);
    setLocation(DEFAULT_FILTERS.location);
    setTags(DEFAULT_FILTERS.tags);
    setSort(DEFAULT_FILTERS.sort);
    setPage(DEFAULT_FILTERS.page);
  };

  const saveCurrentPreset = () => {
    const name = window.prompt('Enter a name for this filter preset:');
    if (!name || !name.trim()) return;

    const preset = {
      id: `${Date.now()}`,
      name: name.trim(),
      filters: {
        searchTerm,
        category,
        subcategory,
        priceMin,
        priceMax,
        condition,
        availability,
        location,
        tags,
        sort,
        page: 1,
        pageSize
      }
    };

    const nextPresets = [preset, ...savedPresets].slice(0, 20);
    setSavedPresets(nextPresets);
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(nextPresets));
  };

  const applyPreset = (presetId) => {
    const preset = savedPresets.find((item) => item.id === presetId);
    if (!preset) return;

    const next = preset.filters || {};
    setSearchTerm(next.searchTerm ?? DEFAULT_FILTERS.searchTerm);
    setCategory(next.category ?? DEFAULT_FILTERS.category);
    setSubcategory(next.subcategory ?? DEFAULT_FILTERS.subcategory);
    setPriceMin(next.priceMin ?? DEFAULT_FILTERS.priceMin);
    setPriceMax(next.priceMax ?? DEFAULT_FILTERS.priceMax);
    setCondition(Array.isArray(next.condition) ? next.condition : DEFAULT_FILTERS.condition);
    setAvailability(Array.isArray(next.availability) ? next.availability : DEFAULT_FILTERS.availability);
    setLocation(Array.isArray(next.location) ? next.location : DEFAULT_FILTERS.location);
    setTags(Array.isArray(next.tags) ? next.tags : DEFAULT_FILTERS.tags);
    setSort(next.sort ?? DEFAULT_FILTERS.sort);
    setPage(1);
  };

  const removePreset = (presetId) => {
    const nextPresets = savedPresets.filter((item) => item.id !== presetId);
    setSavedPresets(nextPresets);
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(nextPresets));
  };

  const activeChips = [
    searchTerm ? { key: 'search', label: `Search: ${searchTerm}`, onRemove: () => setSearchTerm('') } : null,
    category !== 'all' ? { key: 'category', label: `Category: ${category}`, onRemove: () => setCategory('all') } : null,
    subcategory !== 'all' ? { key: 'subcategory', label: `Subcategory: ${subcategory}`, onRemove: () => setSubcategory('all') } : null,
    priceMin !== '' ? { key: 'priceMin', label: `Min Price: ${priceMin}`, onRemove: () => setPriceMin('') } : null,
    priceMax !== '' ? { key: 'priceMax', label: `Max Price: ${priceMax}`, onRemove: () => setPriceMax('') } : null,
    condition !== 'all' ? { key: 'condition', label: `Condition: ${condition}`, onRemove: () => setCondition('all') } : null,
    availability !== 'all' ? { key: 'availability', label: `Availability: ${availability}`, onRemove: () => setAvailability('all') } : null,
    location !== 'all' ? { key: 'location', label: `Location: ${location}`, onRemove: () => setLocation('all') } : null,
    ...tags.map((tag) => ({ key: `tag:${tag}`, label: `Tag: ${tag}`, onRemove: () => setTags((prev) => prev.filter((t) => t !== tag)) }))
  ].filter(Boolean);

  return (
    <div className={`space-y-5 rounded-2xl border border-gray-200 bg-[#f8f9fb] p-5 shadow-sm ${className}`}>
      <button
        type="button"
        onClick={clearAllFilters}
        className="text-sm font-medium text-[#18728a] hover:underline"
      >
        Filters reset
      </button>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Search</label>
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              onBlur={() => commitSearchToHistory(searchTerm)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitSearchToHistory(searchTerm);
              }}
              placeholder="Search with keywords"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#18728a]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#18728a]"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All Categories' : item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Subcategory</label>
          <select
            value={subcategory}
            onChange={(e) => {
              setSubcategory(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#18728a]"
          >
            {subcategories.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All Subcategories' : item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Price Range: Rs.{sliderMin} - Rs.{sliderMax}</p>
          <div className="mb-2 text-sm text-slate-400">Average price: Rs.{Math.round((sliderMin + sliderMax) / 2)}</div>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={maxDetectedPrice}
              value={sliderMin}
              onChange={(e) => {
                const nextMin = Number(e.target.value);
                const clampedMin = Math.min(nextMin, sliderMax);
                setPriceMin(String(clampedMin));
                setPage(1);
              }}
              className="w-full accent-[#18728a]"
            />
            <input
              type="range"
              min="0"
              max={maxDetectedPrice}
              value={sliderMax}
              onChange={(e) => {
                const nextMax = Number(e.target.value);
                const clampedMax = Math.max(nextMax, sliderMin);
                setPriceMax(String(clampedMax));
                setPage(1);
              }}
              className="w-full accent-[#18728a]"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Condition</p>
          <div className="space-y-2">
            {CONDITION_OPTIONS.map((item) => (
              <label key={item.value} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={condition.includes(item.value)}
                  onChange={() => toggleFromList(item.value, setCondition)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#18728a]"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Availability</p>
          <div className="space-y-2">
            {AVAILABILITY_OPTIONS.map((item) => (
              <label key={item.value} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={availability.includes(item.value)}
                  onChange={() => toggleFromList(item.value, setAvailability)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#18728a]"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Location</p>
          <div className="space-y-2">
            {visibleLocations.length === 0 ? (
              <p className="text-sm text-slate-400">No locations available</p>
            ) : (
              visibleLocations.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={location.includes(item)}
                    onChange={() => toggleFromList(item, setLocation)}
                    className="h-4 w-4 rounded border-slate-300 accent-[#18728a]"
                  />
                  {item}
                </label>
              ))
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Tags</p>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => {
              const selected = tags.some((item) => item.toLowerCase() === tag.toLowerCase());
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (selected) {
                      setTags((prev) => prev.filter((item) => item.toLowerCase() !== tag.toLowerCase()));
                    } else {
                      addTag(tag);
                    }
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    selected
                      ? 'border-[#18728a] bg-[#e7f4f7] text-[#0f6378]'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Sort</label>
          <div className="relative">
            <FaSortAmountDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#18728a]"
            >
              <option value="relevance">Relevance</option>
              <option value="rating_desc">Highest rating</option>
              <option value="popularity_desc">Most popular</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name_asc">Name A-Z</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={clearAllFilters}
          className="mt-2 w-full rounded-xl border border-red-300 bg-white py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
        >
          Reset All
        </button>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{paginatedProducts.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{filteredProducts.length}</span> matched products
        </p>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Page size</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          >
            {[6, 12, 24, 48].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={clampedPage <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaChevronLeft /> Prev
          </button>

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={clampedPage >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next <FaChevronRight />
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Page <span className="font-semibold text-gray-900">{clampedPage}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalPages}</span>
        </p>
      </div>

      {typeof children === 'function' &&
        children({
          filteredProducts,
          paginatedProducts,
          pagination: {
            page: clampedPage,
            pageSize,
            totalItems: filteredProducts.length,
            totalPages,
            setPage
          }
        })}
    </div>
  );
};

export default ProductSearchFilter;
