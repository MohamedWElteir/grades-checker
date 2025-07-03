function validateFields(requiredFields) {
  return (req, res, next) => {
    const missingFields = requiredFields.reduce((acc, field) => {
      if (!req.body[field]?.trim()) acc[field] = `${field} is required`;
      return acc;
    }, {});


    if (requiredFields.includes("phoneNumber") && req.body.phoneNumber) {
      const phoneNumber = req.body.phoneNumber.trim();
      if (!/^\+201[0125]\d{8}$/.test(phoneNumber)) {
        missingFields["phoneNumber"] = "Invalid phone number format. Use +201XXXXXXXXX";
      }
    }

    if (Object.keys(missingFields).length > 0) {
      return res.status(400).json({
        error: "Missing or invalid required fields",
        details: missingFields,
      });
    }
    next();
  };
}

module.exports = { validateFields };
