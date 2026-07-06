import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Category } from "../src/models/Category.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedData = [
  // Travel
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

  // Fashion
  { name: "Fashion", parent: null },
  { name: "Fashion Creator", parent: "Fashion" },
  { name: "Fashion Influencer", parent: "Fashion" },
  { name: "Clothing Brand", parent: "Fashion" },
  { name: "Boutique", parent: "Fashion" },
  { name: "Jewelry Brand", parent: "Fashion" },
  { name: "Makeup Artist", parent: "Fashion" }, // Beauty is better parent but user mapped it to Fashion in prompt
  { name: "Model", parent: "Fashion" },
  { name: "Designer", parent: "Fashion" },
  { name: "Luxury Brand", parent: "Fashion" },

  // Technology
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

  // Food
  { name: "Food", parent: null },
  { name: "Food Blogger", parent: "Food" },
  { name: "Restaurant", parent: "Food" },
  { name: "Chef", parent: "Food" },
  { name: "Food Critic", parent: "Food" },
  { name: "Beverage Brand", parent: "Food" },

  // Photography
  { name: "Photography", parent: null },
  { name: "Wedding Photographer", parent: "Photography" },
  { name: "Camera Brand", parent: "Photography" },
  { name: "Portrait Photographer", parent: "Photography" },

  // Add remaining top-level ones
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
  { name: "Hospitality", parent: null },
];

// Combine older legacy categories from INFLUENCER/BRAND arrays into appropriate ones or Top-Level fallback
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
  parent: "Business" // Fallback map them under business/general for now so they don't clog discovery
}));

async function seed() {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/pactogram";
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB.");

    await Category.deleteMany({});
    console.log("Cleared old categories.");

    // Filter out duplicates across seedData and mappedLegacy
    const allCats = [...seedData, ...mappedLegacy];
    const uniqueCats = Array.from(new Map(allCats.map(item => [item.name, item])).values());

    await Category.insertMany(uniqueCats);
    console.log(`Successfully seeded ${uniqueCats.length} categories.`);
  } catch (error) {
    console.error("Error seeding categories:", error);
  } finally {
    mongoose.disconnect();
    console.log("Disconnected.");
  }
}

seed();
