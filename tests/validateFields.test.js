const { validateFields } = require("../middlewares/validateFields");

describe("validateFields middleware", () => {
  it("should return 400 if required fields are missing", () => {
    const req = { body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateFields(["username", "phoneNumber"])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String),
        details: expect.any(Object),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next if all fields are present and valid", () => {
    const req = { body: { username: "test", phoneNumber: "+20123456789" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    validateFields(["username", "phoneNumber"])(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});