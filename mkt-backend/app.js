import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import router from "./routes/index.js";
import swaggerUi from "swagger-ui-express";
import path from "path";
import swaggerFile from "./swagger/swagger_output.json" with { type: "json" };
dotenv.config();

const app = express();
connectDB();

// app.use(cors());
app.use(
  cors({
    origin: "*", // later restrict to your Netlify URL
  }),
);
// app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//   }),
// );
app.use("/api", router);

const PORT = process.env.PORT || 5000;
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.get("/check", (req, res) => {
  res.json("Working...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
