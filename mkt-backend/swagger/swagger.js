import swaggerAutogen from "swagger-autogen";
import dotenv from "dotenv";

dotenv.config();
const doc = {
  swagger: "2.0",
  info: {
    title: "Quiz App",
    description: "Api Docs",
    version: "1.0.0",
  },
  host: process.env.SWAGGER_HOST || "localhost:5000",
  schemes: [process.env.SWAGGER_SCHEME || "http"],
  securityDefinitions: {
    BearerAuth: {
      type: "apiKey",
      name: "auth-token",
      in: "header",
      description: "Enter JWT token like: Bearer <token>",
    },
  },

  security: [
    {
      BearerAuth: [],
    },
  ],
};

const outputFile = "./swagger/swagger_output.json";

const endpointsFiles = ["../app.js"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
