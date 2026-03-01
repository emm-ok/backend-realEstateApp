import Listings from "../listing/listing.model.js";
import Agent from "./agent.model.js";

export const getCurrentAgent = async (req, res) => {
  try {
    if (!req.agent) {
      return res.status(403).json({
        success: false,
        message: "Not an agent",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Agent fetched succesfully",
      agent: req.agent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agent",
    });
  }
};

export const updateAgentById = async (req, res) => {
  try {
    if (!req.agent) {
      return res.status(403).json({
        success: false,
        message: "Not a verified agent",
      });
    }

    // Allowed fields to update
    const allowedProfileFields = [
      "phone",
      "bio",
      "profileImage",
      "areasServed",
      "languages",
      "idDocument",
    ];

    // Update profile fields safely
    allowedProfileFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.agent.profile[field] = req.body[field];
      }
    });

    await req.agent.save();

    return res.status(200).json({
      success: true,
      message: "Agent profile updated successfully",
      data: req.agent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update agent profile",
    });
  }
};

export const getMyListings = async (req, res) => {
  try {
    const properties = await Listings.find({
      agentId: req.agent._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agent listings",
    });
  }
};

export const getAgentStats = async (req, res) => {
  try {
    const agentId = req.agent._id;

    const totalListings = await Listings.countDocuments({ agentId });
    const forSale = await Listings.countDocuments({
      agentId,
      status: "for_sale",
    });
    const forRent = await Listings.countDocuments({
      agentId,
      status: "for_rent",
    });
    const published = await Listings.countDocuments({
      agentId,
      isPublished: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalListings,
        forSale,
        forRent,
        published,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agent stats",
    });
  }
};

export const getAgents = async (req, res) => {
  try {
    const status = req.query.status;

    const filter = {};

    if (status && !["pending", "verified"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invald status query",
      });
    }

    if (status === "pending") {
      filter.verified = false;
    }

    if (status === "verified") {
      filter.verified = true;
    }

    const agents = await Agent.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Agents fetch successfully",
      agents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agents",
    });
  }
};

// Admin Actions
export const getAgentById = async (req, res) => {
  try {
    const { agentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent id",
      });
    }

    const agent = await Agent.findById(agentId)
      .select("-__v");

    if (!agent || agent.agentStatus !== "approved") {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    const listings = await Listings.find({
      agentId,
      isPublished: true,
    }).select("title price status location images");

    return res.status(200).json({
      success: true,
      agent,
      listings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agent",
    });
  }
};

export const suspendAgent = async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    agent.agentStatus = "suspended";
    agent.verified = false;
    await agent.save();

    return res.status(200).json({
      success: true,
      message: "Agent suspended",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Suspension failed",
    });
  }
};
