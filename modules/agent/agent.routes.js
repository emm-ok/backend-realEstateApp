import Router from "express"
import { protect } from "../../middlewares/auth.middleware.js";
import { agentOnly } from "../../middlewares/agent.middleware.js";
import { requireSuperAdmin } from "../../middlewares/admin.middleware.js";
import { getAgentById, getAgents, getAgentStats, getCurrentAgent, getMyListings, suspendAgent, updateAgentById } from "./agent.controller.js";

const agentRouter = Router();

agentRouter.get("/me", protect, agentOnly, getCurrentAgent);
agentRouter.patch("/me", protect, agentOnly, updateAgentById);
agentRouter.get("/me/stats", protect, agentOnly, getAgentStats);
agentRouter.get("/me/listings", protect, agentOnly, getMyListings);

// Admin actions
agentRouter.get("/", protect, requireSuperAdmin, getAgents);
agentRouter.get("/:agentId", protect, getAgentById);
agentRouter.patch("/:agentId", protect, requireSuperAdmin, suspendAgent);



export default agentRouter;