function validateFields(requiredFields) {
  return (req, res, next) => {
    const missingFields = {};
    requiredFields.forEach((field) => {
      if (!req.body[field]) missingFields[field] = `${field} is required`;
    });
    if (Object.keys(missingFields).length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        details: missingFields,
      });
    }
    next();
  };
}

module.exports = { validateFields };