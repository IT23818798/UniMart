export const normalizeValue = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(' ');
  if (typeof value === 'object') return Object.values(value).map(normalizeValue).join(' ');
  return String(value);
};

export const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

export const tokenizeSearchTerm = (searchTerm = '') => {
  return String(searchTerm)
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
};

export const filterProducts = (products = [], filters = {}, searchTokens = []) => {
  const {
    category = 'all',
    subcategory = 'all',
    priceMin = '',
    priceMax = '',
    condition = [],
    availability = [],
    location = [],
    tags = []
  } = filters;

  const minPrice = toNumberOrNull(priceMin);
  const maxPrice = toNumberOrNull(priceMax);

  const selectedConditions = Array.isArray(condition)
    ? condition.map((item) => String(item).toLowerCase())
    : condition && condition !== 'all'
      ? [String(condition).toLowerCase()]
      : [];

  const selectedAvailability = Array.isArray(availability)
    ? availability.map((item) => String(item).toLowerCase())
    : availability && availability !== 'all'
      ? [String(availability).toLowerCase()]
      : [];

  const selectedLocations = Array.isArray(location)
    ? location.map((item) => String(item).toLowerCase())
    : location && location !== 'all'
      ? [String(location).toLowerCase()]
      : [];

  return products.filter((product) => {
    const searchableText = [
      product?.title,
      product?.description,
      product?.category,
      product?.subcategory,
      product?.subCategory,
      product?.seller?.businessName,
      product?.seller?.firstName,
      product?.seller?.lastName,
      product?.location?.city,
      product?.location?.address,
      product?.location,
      ...(product?.tags || [])
    ]
      .map(normalizeValue)
      .join(' ')
      .toLowerCase();

    const matchesTokenizedSearch = searchTokens.every((token) => searchableText.includes(token));

    const productCategory = String(product?.category || '').toLowerCase();
    const productSubcategory = String(product?.subcategory || product?.subCategory || '').toLowerCase();
    const productCondition = String(product?.condition || product?.itemCondition || '').toLowerCase();
    const productLocation = String(
      product?.location?.city || product?.location?.address || product?.location || product?.seller?.address || product?.seller?.location || ''
    ).toLowerCase();

    const productPrice = Number(product?.price || 0);
    const inPriceRange =
      (minPrice === null || productPrice >= minPrice) && (maxPrice === null || productPrice <= maxPrice);

    const hasStock = Number(product?.stock ?? 0) > 0;
    const status = String(product?.status || '').toLowerCase();
    const isAvailable =
      String(product?.status || '').toLowerCase() !== 'inactive' &&
      String(product?.status || '').toLowerCase() !== 'out_of_stock' &&
      hasStock;

    let availabilityValue = 'reserved';
    if (status === 'sold') {
      availabilityValue = 'sold';
    } else if (status === 'reserved') {
      availabilityValue = 'reserved';
    } else if (isAvailable) {
      availabilityValue = 'in_stock';
    } else {
      availabilityValue = 'reserved';
    }

    const availabilityPass =
      selectedAvailability.length === 0 || selectedAvailability.includes(availabilityValue);

    const selectedTags = tags.map((tag) => tag.toLowerCase());
    const productTags = (product?.tags || []).map((tag) => String(tag).toLowerCase());
    const tagsPass = selectedTags.every((tag) => searchableText.includes(tag) || productTags.includes(tag));

    const normalizedCondition = productCondition.replace(/\s+/g, '_');

    const categoryPass = category === 'all' || productCategory === category.toLowerCase();
    const subcategoryPass = subcategory === 'all' || productSubcategory === subcategory.toLowerCase();
    const conditionPass =
      selectedConditions.length === 0 ||
      selectedConditions.includes(productCondition) ||
      selectedConditions.includes(normalizedCondition);
    const locationPass =
      selectedLocations.length === 0 ||
      selectedLocations.some((selectedLocation) => productLocation.includes(selectedLocation));

    return (
      matchesTokenizedSearch &&
      categoryPass &&
      subcategoryPass &&
      inPriceRange &&
      conditionPass &&
      availabilityPass &&
      locationPass &&
      tagsPass
    );
  });
};

export const sortProducts = (products = [], sort = 'relevance') => {
  return [...products].sort((a, b) => {
    const aRating = Number(a?.rating || 0);
    const bRating = Number(b?.rating || 0);
    const aPopularity = Number(a?.numOfReviews || a?.popularity || a?.soldCount || 0);
    const bPopularity = Number(b?.numOfReviews || b?.popularity || b?.soldCount || 0);
    const aPrice = Number(a?.price || 0);
    const bPrice = Number(b?.price || 0);

    switch (sort) {
      case 'rating_desc':
        return bRating - aRating;
      case 'popularity_desc':
        return bPopularity - aPopularity;
      case 'price_asc':
        return aPrice - bPrice;
      case 'price_desc':
        return bPrice - aPrice;
      case 'newest':
        return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
      case 'oldest':
        return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
      case 'name_asc':
        return String(a?.title || '').localeCompare(String(b?.title || ''));
      case 'relevance':
      default:
        return 0;
    }
  });
};

