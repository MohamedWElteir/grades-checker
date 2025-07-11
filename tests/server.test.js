const request = require("supertest");
const app = require("../server");

describe("API Endpoints", () => {
  it("GET / should return welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("routes");
  });

  it("POST /start should validate missing fields", async () => {
    const res = await request(app)
      .post("/start")
      .send({ username: "", phoneNumber: "", token: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
    it("POST /start should validate invalid phone number", async () => {
    const res = await request(app)
      .post("/start")
      .send({
        username: "testuser",
        phoneNumber: "invalid_phone",
        token: "valid_token",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
    });

    it("POST /start should start background process", async () => {
    const res = await request(app)
      .post("/start")
      .send({
        username: "testuser",
        phoneNumber: "+20123456789",
        token: "valid_token",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
    });
    it("DELETE /end should validate missing fields", async () => {
    const res = await request(app)
      .delete("/end")
      .send({ username: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
describe("Documentation Endpoint", () => {
  it("GET /docs should return HTML documentation", async () => {
    const res = await request(app).get("/docs");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("<title>Grades Checker API Documentation</title>");
  });
});