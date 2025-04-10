function validateFields(requiredFields) {
  return (req, res, next) => {
    const missingFields = requiredFields.reduce((acc, field) => {
      if (!req.body[field]?.trim()) acc[field] = `${field} is required`;
      return acc;
    }, {});

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
