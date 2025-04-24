async function validatePage($) {
  const loginPageTitle = $("title").text().trim();
  return loginPageTitle === "كلية العلوم - جامعة الإسكندرية";
}

module.exports = {
  validatePage,
};
