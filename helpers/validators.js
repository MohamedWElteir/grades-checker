const cheerio = require("cheerio");

async function validatePage($) {
     const loginPageTitle = $("title").text().trim();
     return (loginPageTitle === "تسجيل الدخول") ? false : true;
}


module.exports = {
    validatePage,
};