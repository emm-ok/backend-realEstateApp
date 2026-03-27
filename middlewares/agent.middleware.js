import Agent from "../modules/agent/agent.model.js"

export const agentOnly = async(req, res, next) => {
    try{
        const agent = await Agent.findOne({ userId: req.user._id, isSuspended: false })
        .select("-password -__v");

        if(!agent || !agent.verified){
            return res.status(403).json({ 
                success: false,
                message: "Not a verified agent"
            })
        }

        req.agent = agent;
        next()
        
    } catch(err){
        return res.status(500).json({ error: "Server error" })
    }
}