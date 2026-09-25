require('dotenv').config();
const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const Product = require('../models/Product');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const seller = await Seller.findOne({
      $or: [
        { email: /harsha|akalanka/i },
        { firstName: /harsha/i },
        { lastName: /akalanka/i },
        { businessName: /slit|sliit/i }
      ]
    }).sort({ createdAt: -1 });

    if (!seller) {
      console.log(JSON.stringify({ status: 'NO_MATCHING_SELLER' }, null, 2));
      await mongoose.disconnect();
      return;
    }

    const sellerId = seller._id;
    await Product.deleteMany({ seller: sellerId, title: /^Sample / });

    const samples = [
      {
        seller: sellerId,
        title: 'Sample Organic Rice Bag',
        description: 'Premium quality organic rice harvested locally for daily household use.',
        price: 1200,
        stock: 35,
        category: 'Food',
        condition: 'new',
        availability: 'in_stock',
        tags: ['organic', 'rice', 'farmfresh'],
        images: [],
        coverImage: '',
        status: 'active'
      },
      {
        seller: sellerId,
        title: 'Sample Fresh Vegetable Basket',
        description: 'A mixed basket of seasonal vegetables packed fresh from the farm.',
        price: 950,
        stock: 22,
        category: 'Food',
        condition: 'new',
        availability: 'in_stock',
        tags: ['vegetables', 'fresh', 'produce'],
        images: [],
        coverImage: '',
        status: 'active'
      },
      {
        seller: sellerId,
        title: 'Sample Fertilizer Pack',
        description: 'Balanced crop nutrition pack designed to improve plant strength and yield.',
        price: 1800,
        stock: 15,
        category: 'Other',
        condition: 'new',
        availability: 'in_stock',
        tags: ['fertilizer', 'agriculture', 'cropcare'],
        images: [],
        coverImage: '',
        status: 'active'
      }
    ];

    const inserted = await Product.insertMany(samples);

    console.log(JSON.stringify({
      status: 'OK',
      sellerId: String(sellerId),
      businessName: seller.businessName,
      matchedSeller: seller.email,
      insertedCount: inserted.length,
      insertedTitles: inserted.map((p) => p.title)
    }, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('SEED_ERROR', error);
    process.exit(1);
  }
})();
