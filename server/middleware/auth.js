import { clerkClient } from "@clerk/express";

export const protectAdmin =async (req, res, next) => {
    try {
        const {userId} = req.auth();
        console.log("req.auth() =", req.auth());


        const user =await clerkClient.users.getUser(userId);
        if(user.privateMetadata.role !== 'admin') {
            return res.status(403).json({success: false, message: "Not authorized"});
        }

        next();
    } catch (error) {
        console.error("Error in protectAdmin middleware:", error);
        res.status(500).json({ success: false, message: "not authorized" });
    }
}