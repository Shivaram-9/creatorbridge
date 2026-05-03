/** Maps user role to badge CSS class (dark theme). */
export function roleBadgeClass(role) {
  return role === "brand" ? "badge-brand" : "badge-influencer";
}
