import { AppError } from "../middleware/ErrorHandler.js";
import { User } from "../models/User.model.js";

export const toggleSuspendUserService = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    return {
        message: user.isSuspended
            ? "User account suspended successfully"
            : "User account unsuspended successfully",
    };
};



export const getUserByIdService = async (userId) => {
    const user = await User.findById(userId).select("-password"); // exclude sensitive fields
    return {
        user: {
            email: user.email,
            phone: user.phone,
            Payment: user.hasPaid,
            Refferalcount: user.referralCount,
            SuccesfullRefferal: user.successfulReferrals

        }
    };
};



export const getAllUsersService = async ({ page = 1, limit = 10, hasPaid, email }) => {
    // Convert to integers
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // Build query object
    const query = {};

    // Filter by hasPaid
    if (hasPaid !== undefined) {
        query.hasPaid = hasPaid === "true"; // handle string "true"/"false"
    }

    // Filter by email (case-insensitive partial match)
    if (email) {
        query.email = { $regex: email, $options: "i" };
    }

    // Fetch users with pagination
    const users = await User.find(query)
        .select("-password -resetToken") // hide sensitive fields
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

    // Count total
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    return {
        users,
        pagination: {
            totalUsers,
            totalPages,
            currentPage: page,
            pageSize: limit,
        },
    };
};

