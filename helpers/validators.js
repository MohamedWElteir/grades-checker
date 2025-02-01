async function validatePage($) {
     const loginPageTitle = $("title").text().trim();
     if (loginPageTitle === "تسجيل الدخول") return false;
        return true;
}

module.exports = {
    validatePage,
};