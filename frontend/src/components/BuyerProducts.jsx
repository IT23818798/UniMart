import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import './ProductsAndOrders.css';

const BuyerProducts = ({ buyer, onAddToCart, onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedConditions, setSelectedConditions] = useState(['new', 'used', 'like new']);
  const [selectedAvailability, setSelectedAvailability] = useState(['in stock', 'sold', 'reserved']);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchHistory, setSearchHistory] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const history = window.localStorage.getItem('unimart-product-search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.error('Could not parse search history', error);
      }
    }

    const savedFilters = window.localStorage.getItem('unimart-saved-product-filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (parsed.searchTerm !== undefined) setSearchTerm(parsed.searchTerm);
        if (parsed.selectedCategory) setSelectedCategory(parsed.selectedCategory);
        if (parsed.selectedSubcategory) setSelectedSubcategory(parsed.selectedSubcategory);
        if (parsed.minPrice !== undefined) setMinPrice(String(parsed.minPrice));
        if (parsed.maxPrice !== undefined) setMaxPrice(String(parsed.maxPrice));
        if (parsed.priceRange && Array.isArray(parsed.priceRange)) {
          setMinPrice(String(parsed.priceRange[0] ?? 0));
          setMaxPrice(String(parsed.priceRange[1] ?? ''));
        }
        if (parsed.selectedConditions) setSelectedConditions(parsed.selectedConditions);
        if (parsed.selectedAvailability) setSelectedAvailability(parsed.selectedAvailability);
        if (parsed.selectedLocations) setSelectedLocations(parsed.selectedLocations);
        if (parsed.selectedTags) setSelectedTags(parsed.selectedTags);
        if (parsed.sortBy) setSortBy(parsed.sortBy);
      } catch (error) {
        console.error('Could not parse saved filters', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) return;

    const nextHistory = [searchTerm.trim(), ...searchHistory.filter((item) => item !== searchTerm.trim())].slice(0, 6);
    setSearchHistory(nextHistory);
    window.localStorage.setItem('unimart-product-search-history', JSON.stringify(nextHistory));
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = {
    Electronics: ['all', 'Laptops', 'Phones', 'Accessories', 'Tablets', 'Other'],
    Clothing: ['all', 'Men', 'Women', 'Shoes', 'Accessories'],
    Books: ['all', 'Textbooks', 'Novels', 'Notes', 'Other'],
    Home: ['all', 'Furniture', 'Kitchen', 'Decor', 'Other'],
    Sports: ['all', 'Fitness', 'Outdoor', 'Team Sports', 'Equipment'],
    Vehicles: ['all', 'Bicycles', 'Scooters', 'Parts', 'Safety Gear'],
    Stationery: ['all', 'Notebooks', 'Pens', 'Art Supplies', 'Office Supplies'],
    Gadgets: ['all', 'Smartwatches', 'Audio', 'Gaming', 'Accessories'],
    Hostel: ['all', 'Bedding', 'Storage', 'Kitchen Essentials', 'Laundry'],
    Health: ['all', 'Supplements', 'Medical Devices', 'Wellness', 'Personal Care'],
    Events: ['all', 'Tickets', 'Workshops', 'Club Activities', 'Other'],
    Beauty: ['all', 'Skincare', 'Makeup', 'Grooming', 'Other'],
    Food: ['all', 'Snacks', 'Meals', 'Drinks', 'Other'],
    Services: ['all', 'Tutoring', 'Repair', 'Delivery', 'Other'],
    Digital: ['all', 'Software', 'Subscriptions', 'E-books', 'Courses'],
    Other: ['all', 'General'],
  };

  const locationOptions = ['sliit mathara uni', 'kandy uni', 'metropolitan uni', 'malabe uni'];
  const tagOptions = ['#textbooks', '#electronics', '#bestseller', '#stationery', '#accessories', '#studentdeal'];

  const normalizeText = (value) => String(value || '').toLowerCase();

  const tokenizeSearch = (value) =>
    normalizeText(value)
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);

  const getProductSearchBlob = (product) => {
    const tagValues = Array.isArray(product.tags) ? product.tags.join(' ') : '';
    const locationValue = product.location || product.campusArea || product.building || '';
    const subcategoryValue = product.subcategory || deriveSubcategory(product);

    return normalizeText([
      product.title,
      product.description,
      product.category,
      subcategoryValue,
      locationValue,
      tagValues,
    ].join(' '));
  };

  const deriveSubcategory = (product) => {
    const title = normalizeText(product.title);
    const category = product.category;

    if (product.subcategory) return product.subcategory;

    if (category === 'Electronics') {
      if (title.includes('laptop') || title.includes('notebook')) return 'Laptops';
      if (title.includes('phone') || title.includes('mobile')) return 'Phones';
      if (title.includes('charger') || title.includes('earbud') || title.includes('headphone') || title.includes('mouse')) return 'Accessories';
      if (title.includes('tablet')) return 'Tablets';
    }

    if (category === 'Books') {
      if (title.includes('textbook') || title.includes('book')) return 'Textbooks';
      if (title.includes('note')) return 'Notes';
      return 'Novels';
    }

    if (category === 'Clothing') {
      if (title.includes('shoe')) return 'Shoes';
      if (title.includes('bag') || title.includes('watch')) return 'Accessories';
      if (title.includes('men')) return 'Men';
      if (title.includes('women')) return 'Women';
    }

    if (category === 'Home') {
      if (title.includes('chair') || title.includes('table') || title.includes('desk')) return 'Furniture';
      if (title.includes('kitchen')) return 'Kitchen';
      return 'Decor';
    }

    if (category === 'Sports') {
      if (title.includes('dumbbell') || title.includes('yoga') || title.includes('mat')) return 'Fitness';
      if (title.includes('cricket') || title.includes('football') || title.includes('basketball')) return 'Team Sports';
      return 'Equipment';
    }

    if (category === 'Stationery') {
      if (title.includes('pen') || title.includes('pencil')) return 'Pens';
      if (title.includes('book') || title.includes('notebook')) return 'Notebooks';
      return 'Office Supplies';
    }

    if (category === 'Vehicles') {
      if (title.includes('bike') || title.includes('bicycle')) return 'Bicycles';
      if (title.includes('helmet') || title.includes('lock')) return 'Safety Gear';
      return 'Parts';
    }

    if (category === 'Gadgets') {
      if (title.includes('watch')) return 'Smartwatches';
      if (title.includes('speaker') || title.includes('earbud') || title.includes('headphone')) return 'Audio';
      if (title.includes('controller') || title.includes('console')) return 'Gaming';
      return 'Accessories';
    }

    if (category === 'Hostel') {
      if (title.includes('blanket') || title.includes('pillow')) return 'Bedding';
      if (title.includes('basket') || title.includes('box') || title.includes('shelf')) return 'Storage';
      return 'Kitchen Essentials';
    }

    if (category === 'Health') {
      if (title.includes('vitamin') || title.includes('protein')) return 'Supplements';
      if (title.includes('monitor') || title.includes('meter')) return 'Medical Devices';
      return 'Wellness';
    }

    if (category === 'Digital') {
      if (title.includes('course') || title.includes('class')) return 'Courses';
      if (title.includes('ebook') || title.includes('e-book')) return 'E-books';
      if (title.includes('license') || title.includes('software')) return 'Software';
      return 'Subscriptions';
    }

    return 'General';
  };

  const normalizeCondition = (product) => {
    const rawCondition = product.condition || product.itemCondition || product.productCondition || '';
    const normalized = normalizeText(rawCondition);

    if (normalized === 'new' || normalized === 'used' || normalized === 'like new') {
      return normalized;
    }

    return product.stock > 0 ? 'new' : 'used';
  };

  const normalizeAvailability = (product) => {
    const rawAvailability = product.availability || product.status || '';
    const normalized = normalizeText(rawAvailability);

    if (normalized.includes('reserved')) return 'reserved';
    if (normalized.includes('sold')) return 'sold';
    if (normalized.includes('inactive') || normalized.includes('out_of_stock')) return 'sold';
    return product.stock > 0 ? 'in stock' : 'sold';
  };

  const normalizeLocations = (product) => {
    const values = [product.location, product.campusArea, product.building].filter(Boolean).map((value) => String(value).trim());
    return values.length ? values : ['unknown'];
  };

  const normalizeTags = (product) => {
    if (Array.isArray(product.tags) && product.tags.length > 0) {
      return product.tags.map((tag) => String(tag).trim().toLowerCase());
    }

    const derived = [];
    const category = normalizeText(product.category);
    if (category === 'books') derived.push('#textbooks');
    if (category === 'electronics') derived.push('#electronics');
    if (Number(product.rating || 0) >= 4) derived.push('#bestseller');
    return derived;
  };

  const allSubcategories = useMemo(() => {
    const options = categoryMap[selectedCategory] || ['all'];
    return options;
  }, [selectedCategory]);

  const productSuggestions = useMemo(() => {
    const words = new Set();
    products.forEach((product) => {
      tokenizeSearch(product.title).forEach((word) => words.add(word));
    });

    return Array.from(words)
      .filter((word) => word.startsWith(normalizeText(deferredSearchTerm)) && word.length > 1)
      .slice(0, 6);
  }, [products, deferredSearchTerm]);

  const searchTokens = useMemo(() => tokenizeSearch(deferredSearchTerm), [deferredSearchTerm]);

  const highlightRegex = useMemo(() => {
    if (searchTokens.length === 0) return null;

    const escaped = searchTokens
      .filter(Boolean)
      .map((token) => token.toLowerCase())
      .filter((token, index, array) => array.indexOf(token) === index)
      .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (escaped.length === 0) return null;

    return new RegExp(`(${escaped.join('|')})`, 'gi');
  }, [searchTokens]);

  const filterChipData = useMemo(() => {
    const chips = [];

    if (searchTerm.trim()) chips.push({ key: 'search', label: `Search: ${searchTerm.trim()}` });
    if (selectedCategory !== 'all') chips.push({ key: 'category', label: `Category: ${selectedCategory}` });
    if (selectedSubcategory !== 'all') chips.push({ key: 'subcategory', label: `Subcategory: ${selectedSubcategory}` });
    if (minPrice !== '' || maxPrice !== '') {
      chips.push({ key: 'price', label: `Price: Rs.${minPrice || 0} - ${maxPrice ? `Rs.${maxPrice}` : 'Unlimited'}` });
    }
    if (selectedConditions.length > 0 && selectedConditions.length !== 3) chips.push({ key: 'condition', label: `Condition: ${selectedConditions.join(', ')}` });
    if (selectedAvailability.length > 0 && selectedAvailability.length !== 3) chips.push({ key: 'availability', label: `Availability: ${selectedAvailability.join(', ')}` });
    if (selectedLocations.length > 0) chips.push({ key: 'location', label: `Location: ${selectedLocations.join(', ')}` });
    if (selectedTags.length > 0) chips.push({ key: 'tags', label: `Tags: ${selectedTags.join(', ')}` });

    return chips;
  }, [searchTerm, selectedCategory, selectedSubcategory, minPrice, maxPrice, selectedConditions, selectedAvailability, selectedLocations, selectedTags]);

  const toggleValue = (currentValues, value, setValues) => {
    const normalized = normalizeText(value);
    if (currentValues.includes(normalized)) {
      setValues(currentValues.filter((item) => item !== normalized));
    } else {
      setValues([...currentValues, normalized]);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedConditions([]);
    setSelectedAvailability([]);
    setSelectedLocations([]);
    setSelectedTags([]);
    setSortBy('newest');
    setCurrentPage(1);
    setSaveMessage('Filters reset');
  };

  const saveFilters = () => {
    const saved = {
      searchTerm,
      selectedCategory,
      selectedSubcategory,
      minPrice,
      maxPrice,
      selectedConditions,
      selectedAvailability,
      selectedLocations,
      selectedTags,
      sortBy,
    };

    window.localStorage.setItem('unimart-saved-product-filters', JSON.stringify(saved));
    setSaveMessage('Filters saved locally');
  };

  const filteredProducts = useMemo(() => {
    const matchesSearch = (product) => {
      if (searchTokens.length === 0) return true;
      const blob = getProductSearchBlob(product);
      return searchTokens.some((token) => blob.includes(token));
    };

    return products
      .filter((product) => {
        const productPrice = Number(product.price || 0);
        const category = normalizeText(product.category);
        const subcategory = normalizeText(product.subcategory || deriveSubcategory(product));
        const condition = normalizeCondition(product);
        const availability = normalizeAvailability(product);
        const locations = normalizeLocations(product).map(normalizeText);
        const tags = normalizeTags(product);

        const matchesCategory = selectedCategory === 'all' || category === normalizeText(selectedCategory);
        const matchesSubcategory = selectedSubcategory === 'all' || subcategory === normalizeText(selectedSubcategory);
        const min = Math.max(0, Number(minPrice || 0));
        const max = maxPrice === '' ? Number.POSITIVE_INFINITY : Number(maxPrice);
        const matchesPrice = Number.isFinite(productPrice) && productPrice >= min && productPrice <= max;
        const matchesCondition = selectedConditions.length === 0 || selectedConditions.includes(condition);
        const matchesAvailability = selectedAvailability.length === 0 || selectedAvailability.includes(availability);
        const matchesLocation = selectedLocations.length === 0 || selectedLocations.some((location) => locations.includes(location));
        const matchesTag = selectedTags.length === 0 || selectedTags.some((tag) => tags.includes(tag));

        return matchesSearch(product) && matchesCategory && matchesSubcategory && matchesPrice && matchesCondition && matchesAvailability && matchesLocation && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === 'priceLowHigh') return Number(a.price || 0) - Number(b.price || 0);
        if (sortBy === 'priceHighLow') return Number(b.price || 0) - Number(a.price || 0);
        if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortBy === 'highestRating') return Number(b.rating || 0) - Number(a.rating || 0);
        if (sortBy === 'mostPopular') return Number(b.numOfReviews || 0) - Number(a.numOfReviews || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [products, deferredSearchTerm, selectedCategory, selectedSubcategory, minPrice, maxPrice, selectedConditions, selectedAvailability, selectedLocations, selectedTags, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, selectedCategory, selectedSubcategory, minPrice, maxPrice, selectedConditions, selectedAvailability, selectedLocations, selectedTags, sortBy, pageSize]);

  useEffect(() => {
    setSelectedSubcategory('all');
  }, [selectedCategory]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const highlightText = (text) => {
    const source = String(text || '');
    if (!highlightRegex) return source;

    const parts = source.split(highlightRegex);

    return parts.map((part, index) => {
      const isMatch = searchTokens.some((token) => part.toLowerCase() === token);
      return isMatch ? <mark key={`${part}-${index}`} className="search-highlight">{part}</mark> : <span key={`${part}-${index}`}>{part}</span>;
    });
  };

  const applySuggestion = (suggestion) => {
    setSearchTerm(suggestion);
  };

  if (loading) return <div>Loading products...</div>;

  const categories = [
    'all',
    ...new Set([
      ...Object.keys(categoryMap),
      ...products.map((product) => product.category).filter(Boolean),
    ]),
  ];

  const activeChips = filterChipData;

  return (
    <div className="marketplace-container">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="marketplace-header mb-0">Browse Products</h2>
        <div className="w-full max-w-5xl flex flex-col md:flex-row items-stretch md:items-end justify-center gap-4">
          <div className="w-full md:flex-1 relative">
            <input
              type="text"
              placeholder="Search by multiple keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {productSuggestions.length > 0 && searchTerm.trim() && (
              <div className="search-suggestions">
                {productSuggestions.map((suggestion) => (
                  <button key={suggestion} type="button" className="search-suggestion-item" onClick={() => applySuggestion(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-full md:w-64">
            <label className="filter-label" htmlFor="sortBy">Sort By</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-input"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priceLowHigh">Price: Low to High</option>
              <option value="priceHighLow">Price: High to Low</option>
              <option value="highestRating">Highest Rating</option>
              <option value="mostPopular">Most Popular</option>
            </select>
          </div>
        </div>

        {searchHistory.length > 0 && (
          <div className="history-row">
            <span className="history-label">Recent searches:</span>
            <div className="chip-row">
              {searchHistory.map((item) => (
                <button key={item} type="button" className="filter-chip filter-chip-history" onClick={() => setSearchTerm(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeChips.length > 0 && (
          <div className="chip-row">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="filter-chip"
                onClick={() => {
                  if (chip.key === 'search') setSearchTerm('');
                  if (chip.key === 'category') setSelectedCategory('all');
                  if (chip.key === 'subcategory') setSelectedSubcategory('all');
                  if (chip.key === 'price') {
                    setMinPrice('');
                    setMaxPrice('');
                  }
                  if (chip.key === 'condition') setSelectedConditions([]);
                  if (chip.key === 'availability') setSelectedAvailability([]);
                  if (chip.key === 'location') setSelectedLocations([]);
                  if (chip.key === 'tags') setSelectedTags([]);
                }}
              >
                {chip.label} ×
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="products-layout">
        <aside className="filter-sidebar">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="filter-title mb-0">Filter Products</h3>
            <button className="filter-save-button" type="button" onClick={saveFilters}>Save</button>
          </div>
          {saveMessage && <p className="filter-feedback">{saveMessage}</p>}

          <div className="filter-group">
            <label className="filter-label" htmlFor="categoryFilter">Category</label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-input"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="subcategoryFilter">Subcategory</label>
            <select
              id="subcategoryFilter"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="filter-input"
            >
              {allSubcategories.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory === 'all' ? 'All Subcategories' : subcategory}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="price-range-title">PRICE RANGE (RS.)</label>
            <div className="price-range-inline">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="filter-input price-field"
                placeholder="Min"
              />
              <span className="price-range-separator">-</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="filter-input price-field"
                placeholder="Max"
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Condition</label>
            <div className="multi-option-list">
              {['new', 'used', 'like new'].map((condition) => (
                <label key={condition} className="multi-option-item">
                  <input
                    type="checkbox"
                    checked={selectedConditions.includes(condition)}
                    onChange={() => toggleValue(selectedConditions, condition, setSelectedConditions)}
                  />
                  <span>{condition}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Availability</label>
            <div className="multi-option-list">
              {['in stock', 'sold', 'reserved'].map((availability) => (
                <label key={availability} className="multi-option-item">
                  <input
                    type="checkbox"
                    checked={selectedAvailability.includes(availability)}
                    onChange={() => toggleValue(selectedAvailability, availability, setSelectedAvailability)}
                  />
                  <span>{availability}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Location</label>
            <div className="multi-option-list scrollable-list">
              {locationOptions.map((location) => (
                <label key={location} className="multi-option-item">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(normalizeText(location))}
                    onChange={() => toggleValue(selectedLocations, location, setSelectedLocations)}
                  />
                  <span>{location}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Tags</label>
            <div className="chip-row">
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`filter-chip ${selectedTags.includes(normalizeText(tag)) ? 'active' : ''}`}
                  onClick={() => toggleValue(selectedTags, tag, setSelectedTags)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <button className="marketplace-btn marketplace-btn-danger w-full justify-center" onClick={clearFilters} type="button">
              Reset All
            </button>
          </div>
        </aside>

        <section className="products-content">
          <div className="products-toolbar">
            <div>
              <p className="results-count">{filteredProducts.length} result(s) found</p>
              <p className="results-subcopy">Page {currentPage} of {totalPages}</p>
            </div>
          </div>

          <div className="marketplace-grid flex flex-wrap gap-6">
            {paginatedProducts.map((product) => {
              const titleSubcategory = deriveSubcategory(product);

              return (
              <div key={product._id} className="product-card-modern cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onProductClick && onProductClick(product)}>
                <img 
                  src={product.images[0] || 'https://via.placeholder.com/300x200?text=No+Image'} 
                  alt={product.title} 
                  className="product-card-img"
                  loading="lazy"
                  decoding="async"
                />
                <div className="product-card-body">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="product-card-title">{highlightText(product.title)}</h3>
                    <span className="product-card-price">Rs {product.price}</span>
                  </div>
                  <p className="product-card-seller">Seller: {product.seller?.businessName || 'Unknown'}</p>
                  <p className="product-card-desc truncate">{highlightText(product.description)}</p>
                  
                  <div className="product-card-footer">
                    <div className="flex flex-wrap gap-2">
                      <span className="badge-category">{product.category}</span>
                      <span className="badge-category">{titleSubcategory}</span>
                      <span className="badge-category">{normalizeCondition(product)}</span>
                      <span className="badge-category">{normalizeAvailability(product)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      disabled={product.stock <= 0}
                      className={`marketplace-btn ${
                        product.stock > 0 
                          ? 'marketplace-btn-primary' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No products found matching your filters.
              </div>
            )}
          </div>

          {filteredProducts.length > pageSize && (
            <div className="pagination-row">
              <button className="pagination-button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button>
              <div className="pagination-pages">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index + 1}
                    className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(index + 1)}
                    type="button"
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button className="pagination-button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Next</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BuyerProducts;
