export const getRange = (type) => {
    const now = new Date();

    if (type === "daily") {
        return {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
            $lt: new Date(now.setHours(23, 59, 59, 999)),
        };
    }

    if (type === "monthly") {
        return {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
    }

    if (type === "yearly") {
        return {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lt: new Date(now.getFullYear() + 1, 0, 1),
        };
    }
};