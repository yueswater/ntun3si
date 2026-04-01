import express from "express";
import {
  createOfficer,
  getOfficers,
  updateOfficer,
  deleteOfficer,
} from "../controllers/officerController.js";
import { verifyToken, adminOnly } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createOfficerSchema,
  updateOfficerSchema,
} from "../validators/officerValidator.js";

const router = express.Router();

router.get("/", getOfficers);
router.post("/", verifyToken, adminOnly, validate(createOfficerSchema), createOfficer);
router.put("/:uid", verifyToken, adminOnly, validate(updateOfficerSchema), updateOfficer);
router.delete("/:uid", verifyToken, adminOnly, deleteOfficer);

export default router;
