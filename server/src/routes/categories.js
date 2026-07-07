import { Router } from "express";
import { Category } from "../models/Category.js";

export const categoriesRouter = Router();

// GET /api/categories/onboarding
// Fetch ALL categories for the onboarding screen, sorted alphabetically.
categoriesRouter.get("/onboarding", async (req, res) => {
  try {
    let categories = await Category.find({})
      .select("name parent")
      .sort({ name: 1 })
      .lean();

    // Auto-seed if empty!
    if (categories.length === 0) {
      console.log("Database has 0 categories. Auto-seeding now...");
      
      const seedData = [
        { name: "Travel", parent: null },
        { name: "Travel Creator", parent: "Travel" },
        { name: "Travel Vlogger", parent: "Travel" },
        { name: "Travel Photographer", parent: "Travel" },
        { name: "Tourism Brand", parent: "Travel" },
        { name: "Hotel", parent: "Travel" },
        { name: "Resort", parent: "Travel" },
        { name: "Homestay", parent: "Travel" },
        { name: "Adventure Company", parent: "Travel" },
        { name: "Trekking Group", parent: "Travel" },
        { name: "Travel Agency", parent: "Travel" },
        { name: "Airline", parent: "Travel" },
        { name: "Cruise", parent: "Travel" },
        { name: "Backpacking Creator", parent: "Travel" },
        { name: "Fashion", parent: null },
        { name: "Fashion Creator", parent: "Fashion" },
        { name: "Fashion Influencer", parent: "Fashion" },
        { name: "Clothing Brand", parent: "Fashion" },
        { name: "Boutique", parent: "Fashion" },
        { name: "Jewelry Brand", parent: "Fashion" },
        { name: "Makeup Artist", parent: "Fashion" },
        { name: "Model", parent: "Fashion" },
        { name: "Designer", parent: "Fashion" },
        { name: "Luxury Brand", parent: "Fashion" },
        { name: "Technology", parent: null },
        { name: "Tech Reviewer", parent: "Technology" },
        { name: "Software Company", parent: "Technology" },
        { name: "SaaS", parent: "Technology" },
        { name: "AI Startup", parent: "Technology" },
        { name: "Mobile Brand", parent: "Technology" },
        { name: "Laptop Brand", parent: "Technology" },
        { name: "Electronics", parent: "Technology" },
        { name: "Developer", parent: "Technology" },
        { name: "IT Services", parent: "Technology" },
        { name: "Food", parent: null },
        { name: "Food Blogger", parent: "Food" },
        { name: "Restaurant", parent: "Food" },
        { name: "Chef", parent: "Food" },
        { name: "Food Critic", parent: "Food" },
        { name: "Beverage Brand", parent: "Food" },
        { name: "Photography", parent: null },
        { name: "Wedding Photographer", parent: "Photography" },
        { name: "Camera Brand", parent: "Photography" },
        { name: "Portrait Photographer", parent: "Photography" },
        { name: "Beauty", parent: null },
        { name: "Gaming", parent: null },
        { name: "Fitness", parent: null },
        { name: "Finance", parent: null },
        { name: "Education", parent: null },
        { name: "Healthcare", parent: null },
        { name: "Entertainment", parent: null },
        { name: "Automobile", parent: null },
        { name: "Music", parent: null },
        { name: "Sports", parent: null },
        { name: "Real Estate", parent: null },
        { name: "Lifestyle", parent: null },
        { name: "Luxury", parent: null },
        { name: "Parenting", parent: null },
        { name: "Pets", parent: null },
        { name: "Business", parent: null },
        { name: "AI", parent: null },
        { name: "Startups", parent: null },
        { name: "Events", parent: null },
        { name: "NGOs", parent: null },
        { name: "Hospitality", parent: null }
      ];

      const legacyCategories = [
        { name: "Apparel", parent: "Fashion" },
        { name: "Astrology", parent: "Lifestyle" },
        { name: "Blogging", parent: "Lifestyle" },
        { name: "Coaching", parent: "Education" },
        { name: "Comedy", parent: "Entertainment" },
        { name: "Crafts", parent: "Art" },
        { name: "Culinary", parent: "Food" },
        { name: "Dance", parent: "Entertainment" },
        { name: "Dating", parent: "Lifestyle" },
        { name: "Decor", parent: "Lifestyle" },
        { name: "DIY", parent: "Lifestyle" },
        { name: "Film", parent: "Entertainment" },
        { name: "Floral", parent: "Lifestyle" },
        { name: "Gardening", parent: "Lifestyle" },
        { name: "Graphic Design", parent: "Technology" },
        { name: "Illustration", parent: "Technology" },
        { name: "Jewelry", parent: "Fashion" },
        { name: "Martial Arts", parent: "Sports" },
        { name: "Motivation", parent: "Lifestyle" },
        { name: "Personal Training", parent: "Fitness" },
        { name: "Podcast", parent: "Entertainment" },
        { name: "Tattoos", parent: "Lifestyle" },
        { name: "Theater", parent: "Entertainment" },
        { name: "Video Production", parent: "Entertainment" },
        { name: "Wedding Planning", parent: "Lifestyle" },
        { name: "Yoga", parent: "Fitness" },
        { name: "Wellness", parent: "Healthcare" },
        { name: "Marketing", parent: "Business" },
        { name: "Agency", parent: "Business" },
        { name: "Ecommerce", parent: "Technology" },
        { name: "News", parent: "Business" },
        { name: "Politics", parent: "Business" },
        { name: "Consulting", parent: "Business" },
        { name: "Hardware", parent: "Technology" },
        { name: "Agriculture", parent: "Business" },
        { name: "Architecture", parent: "Business" },
        { name: "Aviation", parent: "Travel" },
        { name: "Biotechnology", parent: "Healthcare" },
        { name: "Chemicals", parent: "Business" },
        { name: "Construction", parent: "Business" },
        { name: "Energy", parent: "Business" },
        { name: "Environment", parent: "Business" },
        { name: "Insurance", parent: "Finance" },
        { name: "Legal", parent: "Business" },
        { name: "Logistics", parent: "Business" },
        { name: "Manufacturing", parent: "Business" },
        { name: "Media", parent: "Entertainment" },
        { name: "Non-Profit", parent: "Business" },
        { name: "Pharmaceuticals", parent: "Healthcare" },
        { name: "Retail", parent: "Business" },
        { name: "Telecommunications", parent: "Technology" },
        { name: "Transportation", parent: "Business" },
        { name: "Veterinary", parent: "Healthcare" },
        { name: "Wholesale", parent: "Business" },
        { name: "Writing", parent: "Entertainment" },
        { name: "Accounting", parent: "Finance" },
        { name: "Advertising", parent: "Business" },
        { name: "Banking", parent: "Finance" },
        { name: "Crypto", parent: "Finance" },
        { name: "Dentistry", parent: "Healthcare" },
        { name: "E-learning", parent: "Education" },
        { name: "Engineering", parent: "Technology" },
        { name: "Farming", parent: "Business" },
        { name: "Furniture", parent: "Lifestyle" },
        { name: "Genealogy", parent: "Lifestyle" },
        { name: "Home Improvement", parent: "Lifestyle" },
        { name: "Human Resources", parent: "Business" },
        { name: "Interior Design", parent: "Lifestyle" },
        { name: "Investment", parent: "Finance" },
        { name: "Journalism", parent: "Business" },
        { name: "Languages", parent: "Education" },
        { name: "Magic", parent: "Entertainment" },
        { name: "Management", parent: "Business" },
        { name: "Mental Health", parent: "Healthcare" },
        { name: "Nutrition", parent: "Healthcare" },
        { name: "Public Relations", parent: "Business" },
        { name: "Publishing", parent: "Business" },
        { name: "Recruiting", parent: "Business" },
        { name: "Robotics", parent: "Technology" },
        { name: "Sales", parent: "Business" },
        { name: "Science", parent: "Education" },
        { name: "Security", parent: "Technology" },
        { name: "SEO", parent: "Technology" },
        { name: "Social Media", parent: "Technology" },
        { name: "Software Development", parent: "Technology" },
        { name: "Space", parent: "Technology" },
        { name: "Sustainability", parent: "Business" },
        { name: "Taxes", parent: "Finance" },
        { name: "Translation", parent: "Education" },
        { name: "Tutoring", parent: "Education" },
        { name: "UI/UX", parent: "Technology" },
        { name: "Venture Capital", parent: "Finance" },
        { name: "Virtual Reality", parent: "Technology" },
        { name: "Web Design", parent: "Technology" },
        { name: "Web3", parent: "Technology" },
        { name: "Zoology", parent: "Education" }
      ];

      const allCats = [...seedData, ...legacyCategories];
      const uniqueCats = Array.from(new Map(allCats.map(item => [item.name, item])).values());
      const docs = uniqueCats.map(c => ({
        ...c,
        popularity: Math.floor(Math.random() * 100)
      }));

      await Category.insertMany(docs);
      console.log("Database automatically seeded with categories!");
      
      // Fetch the newly inserted categories
      categories = await Category.find({})
        .select("name parent")
        .sort({ name: 1 })
        .lean();
    }

    res.json(categories);
  } catch (error) {
    console.error("Error fetching onboarding categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/categories/discovery
// Fetch high-level (discovery) categories only.
categoriesRouter.get("/discovery", async (req, res) => {
  try {
    const categories = await Category.find({ parent: null })
      .select("name popularity")
      .sort({ name: 1 })
      .lean();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching discovery categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/categories/search
// Search all categories by keyword.
categoriesRouter.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const keyword = String(q).trim();
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const categories = await Category.find({
      $or: [
        { name: regex },
        { searchKeywords: regex }
      ]
    })
      .select("name parent popularity")
      .sort({ popularity: -1, name: 1 })
      .limit(20)
      .lean();

    res.json(categories);
  } catch (error) {
    console.error("Error searching categories:", error);
    res.status(500).json({ error: "Failed to search categories" });
  }
});

// GET /api/categories/seed
// One-time seed endpoint
categoriesRouter.get("/seed", async (req, res) => {
  try {
    const seedData = [
      { name: "Travel", parent: null },
      { name: "Travel Creator", parent: "Travel" },
      { name: "Travel Vlogger", parent: "Travel" },
      { name: "Travel Photographer", parent: "Travel" },
      { name: "Tourism Brand", parent: "Travel" },
      { name: "Hotel", parent: "Travel" },
      { name: "Resort", parent: "Travel" },
      { name: "Homestay", parent: "Travel" },
      { name: "Adventure Company", parent: "Travel" },
      { name: "Trekking Group", parent: "Travel" },
      { name: "Travel Agency", parent: "Travel" },
      { name: "Airline", parent: "Travel" },
      { name: "Cruise", parent: "Travel" },
      { name: "Backpacking Creator", parent: "Travel" },
      { name: "Fashion", parent: null },
      { name: "Fashion Creator", parent: "Fashion" },
      { name: "Fashion Influencer", parent: "Fashion" },
      { name: "Clothing Brand", parent: "Fashion" },
      { name: "Boutique", parent: "Fashion" },
      { name: "Jewelry Brand", parent: "Fashion" },
      { name: "Makeup Artist", parent: "Fashion" },
      { name: "Model", parent: "Fashion" },
      { name: "Designer", parent: "Fashion" },
      { name: "Luxury Brand", parent: "Fashion" },
      { name: "Technology", parent: null },
      { name: "Tech Reviewer", parent: "Technology" },
      { name: "Software Company", parent: "Technology" },
      { name: "SaaS", parent: "Technology" },
      { name: "AI Startup", parent: "Technology" },
      { name: "Mobile Brand", parent: "Technology" },
      { name: "Laptop Brand", parent: "Technology" },
      { name: "Electronics", parent: "Technology" },
      { name: "Developer", parent: "Technology" },
      { name: "IT Services", parent: "Technology" },
      { name: "Food", parent: null },
      { name: "Food Blogger", parent: "Food" },
      { name: "Restaurant", parent: "Food" },
      { name: "Chef", parent: "Food" },
      { name: "Food Critic", parent: "Food" },
      { name: "Beverage Brand", parent: "Food" },
      { name: "Photography", parent: null },
      { name: "Wedding Photographer", parent: "Photography" },
      { name: "Camera Brand", parent: "Photography" },
      { name: "Portrait Photographer", parent: "Photography" },
      { name: "Beauty", parent: null },
      { name: "Gaming", parent: null },
      { name: "Fitness", parent: null },
      { name: "Finance", parent: null },
      { name: "Education", parent: null },
      { name: "Healthcare", parent: null },
      { name: "Entertainment", parent: null },
      { name: "Automobile", parent: null },
      { name: "Music", parent: null },
      { name: "Sports", parent: null },
      { name: "Real Estate", parent: null },
      { name: "Lifestyle", parent: null },
      { name: "Luxury", parent: null },
      { name: "Parenting", parent: null },
      { name: "Pets", parent: null },
      { name: "Business", parent: null },
      { name: "AI", parent: null },
      { name: "Startups", parent: null },
      { name: "Events", parent: null },
      { name: "NGOs", parent: null },
      { name: "Hospitality", parent: null }
    ];

    const legacyCategories = [
      { name: "Apparel", parent: "Fashion" },
      { name: "Astrology", parent: "Lifestyle" },
      { name: "Blogging", parent: "Lifestyle" },
      { name: "Coaching", parent: "Education" },
      { name: "Comedy", parent: "Entertainment" },
      { name: "Crafts", parent: "Art" },
      { name: "Culinary", parent: "Food" },
      { name: "Dance", parent: "Entertainment" },
      { name: "Dating", parent: "Lifestyle" },
      { name: "Decor", parent: "Lifestyle" },
      { name: "DIY", parent: "Lifestyle" },
      { name: "Film", parent: "Entertainment" },
      { name: "Floral", parent: "Lifestyle" },
      { name: "Gardening", parent: "Lifestyle" },
      { name: "Graphic Design", parent: "Technology" },
      { name: "Illustration", parent: "Technology" },
      { name: "Jewelry", parent: "Fashion" },
      { name: "Martial Arts", parent: "Sports" },
      { name: "Motivation", parent: "Lifestyle" },
      { name: "Personal Training", parent: "Fitness" },
      { name: "Podcast", parent: "Entertainment" },
      { name: "Tattoos", parent: "Lifestyle" },
      { name: "Theater", parent: "Entertainment" },
      { name: "Video Production", parent: "Entertainment" },
      { name: "Wedding Planning", parent: "Lifestyle" },
      { name: "Yoga", parent: "Fitness" },
      { name: "Wellness", parent: "Healthcare" },
      { name: "Marketing", parent: "Business" },
      { name: "Agency", parent: "Business" },
      { name: "Ecommerce", parent: "Technology" },
      { name: "News", parent: "Business" },
      { name: "Politics", parent: "Business" },
      { name: "Consulting", parent: "Business" },
      { name: "Hardware", parent: "Technology" },
      { name: "Agriculture", parent: "Business" },
      { name: "Architecture", parent: "Business" },
      { name: "Aviation", parent: "Travel" },
      { name: "Biotechnology", parent: "Healthcare" },
      { name: "Chemicals", parent: "Business" },
      { name: "Construction", parent: "Business" },
      { name: "Energy", parent: "Business" },
      { name: "Environment", parent: "Business" },
      { name: "Insurance", parent: "Finance" },
      { name: "Legal", parent: "Business" },
      { name: "Logistics", parent: "Business" },
      { name: "Manufacturing", parent: "Business" },
      { name: "Media", parent: "Entertainment" },
      { name: "Non-Profit", parent: "Business" },
      { name: "Pharmaceuticals", parent: "Healthcare" },
      { name: "Retail", parent: "Business" },
      { name: "Telecommunications", parent: "Technology" },
      { name: "Transportation", parent: "Business" },
      { name: "Veterinary", parent: "Healthcare" },
      { name: "Wholesale", parent: "Business" },
      { name: "Writing", parent: "Entertainment" },
      { name: "Accounting", parent: "Finance" },
      { name: "Advertising", parent: "Business" },
      { name: "Banking", parent: "Finance" },
      { name: "Crypto", parent: "Finance" },
      { name: "Dentistry", parent: "Healthcare" },
      { name: "E-learning", parent: "Education" },
      { name: "Engineering", parent: "Technology" },
      { name: "Farming", parent: "Business" },
      { name: "Furniture", parent: "Lifestyle" },
      { name: "Genealogy", parent: "Lifestyle" },
      { name: "Home Improvement", parent: "Lifestyle" },
      { name: "Human Resources", parent: "Business" },
      { name: "Interior Design", parent: "Lifestyle" },
      { name: "Investment", parent: "Finance" },
      { name: "Journalism", parent: "Business" },
      { name: "Languages", parent: "Education" },
      { name: "Magic", parent: "Entertainment" },
      { name: "Management", parent: "Business" },
      { name: "Mental Health", parent: "Healthcare" },
      { name: "Nutrition", parent: "Healthcare" },
      { name: "Public Relations", parent: "Business" },
      { name: "Publishing", parent: "Business" },
      { name: "Recruiting", parent: "Business" },
      { name: "Robotics", parent: "Technology" },
      { name: "Sales", parent: "Business" },
      { name: "Science", parent: "Education" },
      { name: "Security", parent: "Technology" },
      { name: "SEO", parent: "Technology" },
      { name: "Social Media", parent: "Technology" },
      { name: "Software Development", parent: "Technology" },
      { name: "Space", parent: "Technology" },
      { name: "Sustainability", parent: "Business" },
      { name: "Taxes", parent: "Finance" },
      { name: "Translation", parent: "Education" },
      { name: "Tutoring", parent: "Education" },
      { name: "UI/UX", parent: "Technology" },
      { name: "Venture Capital", parent: "Finance" },
      { name: "Virtual Reality", parent: "Technology" },
      { name: "Web Design", parent: "Technology" },
      { name: "Web3", parent: "Technology" },
      { name: "Zoology", parent: "Education" }
    ];

    const mappedLegacy = legacyCategories;

    const allCats = [...seedData, ...mappedLegacy];
    const uniqueCats = Array.from(new Map(allCats.map(item => [item.name, item])).values());

    await Category.deleteMany({});
    await Category.insertMany(uniqueCats);
    res.json({ success: true, count: uniqueCats.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
