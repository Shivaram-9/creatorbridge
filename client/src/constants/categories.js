/** Shared categories for profiles and discovery filters */

export const INFLUENCER_CATEGORIES = [
  "Fashion", "Automobile", "Food", "Travel", "Fitness", "Music", "Gaming", 
  "Photography", "Beauty", "Sports", "Art", "Design", "Entertainment", 
  "Apparel", "Astrology", "Blogging", "Coaching", "Comedy", "Crafts", 
  "Culinary", "Dance", "Dating", "Decor", "DIY", "Film", "Floral", 
  "Gardening", "Graphic Design", "Illustration", "Jewelry", "Martial Arts", 
  "Modeling", "Motivation", "Parenting", "Personal Training", "Pets", 
  "Podcast", "Tattoos", "Theater", "Video Production", "Vlogging", 
  "Wedding Planning", "Yoga", "Wellness"
].sort();

export const BRAND_CATEGORIES = [
  "Technology", "Education", "Finance", "Healthcare", "Real Estate", "Luxury", 
  "Startup", "Marketing", "Agency", "Ecommerce", "News", "Politics", "Consulting", 
  "Software", "Hardware", "Agriculture", "Architecture", "Aviation", "Biotechnology", 
  "Chemicals", "Construction", "Energy", "Environment", "Events", "Insurance", 
  "Legal", "Logistics", "Manufacturing", "Media", "Non-Profit", "Pharmaceuticals", 
  "Retail", "Telecommunications", "Transportation", "Veterinary", "Wholesale", 
  "Writing", "Accounting", "Advertising", "Banking", "Crypto", "Dentistry", 
  "E-learning", "Engineering", "Farming", "Furniture", "Genealogy", "Home Improvement", 
  "Hospitality", "Human Resources", "Interior Design", "Investment", "Journalism", 
  "Languages", "Magic", "Management", "Mental Health", "Nutrition", "Public Relations", 
  "Publishing", "Recruiting", "Robotics", "Sales", "Science", "Security", "SEO", 
  "Social Media", "Software Development", "Space", "Sustainability", "Taxes", 
  "Translation", "Tutoring", "UI/UX", "Venture Capital", "Virtual Reality", 
  "Web Design", "Web3", "Zoology"
].sort();

export const ALL_CATEGORIES = [...new Set([...INFLUENCER_CATEGORIES, ...BRAND_CATEGORIES])].sort();

// Fallback compatibility for any direct imports of CATEGORIES
export const CATEGORIES = ALL_CATEGORIES;
