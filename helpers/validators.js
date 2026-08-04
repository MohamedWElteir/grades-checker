async function validatePage($) {
  const loginPageTitle = $("title").text().trim();
  return loginPageTitle === "كلية العلوم - جامعة الإسكندرية";
}
function validateToken(token) {
  if (typeof token !== "string") return false;
  const t = token.trim();
  if (!t) return false;
  const expression =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return expression.test(t);
}

module.exports = {
  validatePage,
  validateToken,
};
