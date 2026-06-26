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

export const RELATED_CATEGORIES = {
  "Fashion": ["Beauty", "Lifestyle", "Accessories", "Luxury", "Apparel", "Modeling", "Jewelry"],
  "Fitness": ["Health", "Nutrition", "Sports", "Wellness", "Personal Training", "Yoga", "Martial Arts"],
  "Food": ["Culinary", "Nutrition", "Hospitality", "Agriculture", "Farming"],
  "Travel": ["Hospitality", "Photography", "Vlogging", "Aviation"],
  "Music": ["Entertainment", "Theater", "Dance", "Audio", "Podcast"],
  "Gaming": ["Entertainment", "Technology", "Software", "Web3"],
  "Photography": ["Art", "Design", "Travel", "Fashion", "Video Production", "Illustration"],
  "Beauty": ["Fashion", "Wellness", "Lifestyle", "Cosmetics", "Skincare"],
  "Technology": ["Software", "Hardware", "Web3", "Robotics", "Ecommerce", "Startup", "Telecommunications"],
  "Education": ["E-learning", "Tutoring", "Coaching", "Languages", "Science"],
  "Finance": ["Banking", "Crypto", "Investment", "Taxes", "Accounting"],
  "Healthcare": ["Wellness", "Nutrition", "Mental Health", "Fitness", "Pharmaceuticals", "Dentistry", "Veterinary"],
  "Marketing": ["Advertising", "SEO", "Public Relations", "Social Media", "Agency"],
  "Art": ["Design", "Illustration", "Photography", "Graphic Design", "Crafts", "DIY"],
  "Design": ["Art", "Architecture", "Graphic Design", "Interior Design", "UI/UX", "Web Design"],
  "Media": ["News", "Journalism", "Publishing", "Video Production", "Podcast", "Social Media"],
  "Real Estate": ["Architecture", "Interior Design", "Construction", "Home Improvement"],
  "Luxury": ["Fashion", "Beauty", "Travel", "Real Estate", "Automobile"],
  "Automobile": ["Technology", "Travel", "Logistics", "Transportation"]
};

export const getRelatedCategories = (category) => {
  if (!category) return [];
  return RELATED_CATEGORIES[category] || [];
};
