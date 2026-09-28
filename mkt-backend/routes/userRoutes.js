import express from "express";
import {
  createTmgUser,
  deleteTmgUser,
  getTmgUsers,
  updateTmgUser,
} from "../controllers/tmgUser.controller.js";
import {
  createFinanceUser,
  deleteFinanceUser,
  getFinanceUsers,
  updateFinanceUser,
} from "../controllers/financeUser.controller.js";
import {
  createRequest,
  getRequests,
  updateRequests,
  deleteRequest,
} from "../controllers/request.controller.js";
import {
  createUser,
  deleteUser,
  getUsers,
  login,
  updateUser,
} from "../controllers/user.controller.js";
import {
  createBGV,
  deleteBGV,
  getBGVs,
  updateBGV,
} from "../controllers/bgv.controller.js";
import {
  bulkCreateClients,
  createClient,
  deleteClient,
  getClients,
} from "../controllers/client.controller.js";
import { uploadRequestAttachment } from "../config/multer.js";
import { authenticateToken, requireRoles } from "../middleware/auth.js";

const userRouter = express.Router();

// userRouter.post("/add-tmg-user", createTmgUser);
// userRouter.get("/get-tmg-user", getTmgUsers);
// userRouter.post("/update-tmg-user", updateTmgUser);
// userRouter.post("/delete-tmg-user", deleteTmgUser);

// userRouter.post("/add-finance-user", createFinanceUser);
// userRouter.get("/get-finance-user", getFinanceUsers);
// userRouter.post("/update-finance-user", updateFinanceUser);
// userRouter.post("/delete-finance-user", deleteFinanceUser);

userRouter.post("/login", login);
userRouter.use(authenticateToken);

userRouter.post("/create-request", requireRoles("user", "admin", "super_admin"), uploadRequestAttachment, createRequest);
userRouter.get("/get-request", getRequests);
userRouter.post("/update-request", requireRoles("tmg", "rmg", "finance"), updateRequests);
userRouter.post("/delete-request", requireRoles("user", "admin", "super_admin"), deleteRequest);

userRouter.post("/create-bgv", requireRoles("user", "admin", "super_admin"), createBGV);
userRouter.get("/get-bgv", getBGVs);
userRouter.post("/update-bgv", requireRoles("market_leader", "admin", "super_admin"), updateBGV);
userRouter.post("/delete-bgv", requireRoles("admin", "super_admin"), deleteBGV);

userRouter.get("/get-clients", requireRoles("user", "admin", "super_admin"), getClients);
userRouter.post("/create-client", requireRoles("admin", "super_admin"), createClient);
userRouter.post("/bulk-create-clients", requireRoles("admin", "super_admin"), bulkCreateClients);
userRouter.post("/delete-client", requireRoles("admin", "super_admin"), deleteClient);

userRouter.post("/create-user", requireRoles("admin", "super_admin"), createUser);
userRouter.post("/get-user", getUsers);
userRouter.post("/delete-user", requireRoles("admin", "super_admin"), deleteUser);
userRouter.post("/update-user", requireRoles("admin", "super_admin"), updateUser);

export default userRouter;
