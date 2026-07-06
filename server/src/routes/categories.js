import { Router } from "express";
import { Category } from "../models/Category.js";

export const categoriesRouter = Router();

// GET /api/categories/onboarding
// Fetch ALL categories for the onboarding screen, sorted alphabetically.
categoriesRouter.get("/onboarding", async (req, res) => {
  try {
    const categories = await Category.find({})
      .select("name parent")
      .sort({ name: 1 })
      .lean();
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
      "Apparel", "Astrology", "Blogging", "Coaching", "Comedy", "Crafts", 
      "Culinary", "Dance", "Dating", "Decor", "DIY", "Film", "Floral", 
      "Gardening", "Graphic Design", "Illustration", "Jewelry", "Martial Arts", 
      "Motivation", "Personal Training", "Podcast", "Tattoos", "Theater", 
      "Video Production", "Wedding Planning", "Yoga", "Wellness",
      "Marketing", "Agency", "Ecommerce", "News", "Politics", "Consulting", 
      "Hardware", "Agriculture", "Architecture", "Aviation", "Biotechnology", 
      "Chemicals", "Construction", "Energy", "Environment", "Insurance", 
      "Legal", "Logistics", "Manufacturing", "Media", "Non-Profit", "Pharmaceuticals", 
      "Retail", "Telecommunications", "Transportation", "Veterinary", "Wholesale", 
      "Writing", "Accounting", "Advertising", "Banking", "Crypto", "Dentistry", 
      "E-learning", "Engineering", "Farming", "Furniture", "Genealogy", "Home Improvement", 
      "Human Resources", "Interior Design", "Investment", "Journalism", 
      "Languages", "Magic", "Management", "Mental Health", "Nutrition", "Public Relations", 
      "Publishing", "Recruiting", "Robotics", "Sales", "Science", "Security", "SEO", 
      "Social Media", "Software Development", "Space", "Sustainability", "Taxes", 
      "Translation", "Tutoring", "UI/UX", "Venture Capital", "Virtual Reality", 
      "Web Design", "Web3", "Zoology"
    ];

    const mappedLegacy = legacyCategories.map(cat => ({
      name: cat,
      parent: "Business" 
    }));

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
