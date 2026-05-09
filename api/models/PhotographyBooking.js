/**
 * PhotographyBooking Model Schema
 */

module.exports = {
    attributes: {
        bookingNumber: {
            type: "string",
            unique: true,
        },
        estimate: {
            model: "photographyestimate",
            required: true,
        },
        client: {
            model: "photographyclient",
            required: true,
        },
        agent: {
            model: "user",
            required: true,
        },
        company: {
            model: "company",
        },
        event: {
            type: "json",
            defaultsTo: [],
        },  
        gst: {
            type: "number",
            defaultsTo: 0,
        },
        totalAmount: {
            type: "number",
            defaultsTo: 0,
        },
        tokenAmount: {
            type: "number",
            defaultsTo: 0,
        },
        pendingAmount: {
            type: "number",
            defaultsTo: 0,
        },
        paymentStatus: {
            type: "string",
            allowNull: true,
            isIn: ["pending", "partial", "paid", "extra"],
        },
        status: {
            type: "boolean",
            defaultsTo: true,
        },
        isDeleted: {
            type: "boolean",
        },
        deletedAt: {
            type: "ref",
            columnType: "datetime",
        },
        deletedBy: {
            model: "user",
        },
    },
};
