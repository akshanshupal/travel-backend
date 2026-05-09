/**
 * PhotographyPayment Model Schema
 */

module.exports = {
    attributes: {
        photographyBooking: {
            model: "photographybooking",
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
        amount: {
            type: "number",
            required: true,
        },
        paymentDate: {
            type: "ref",
            columnType: "datetime",
        },
        paymentStore: {
            model: "paymentStore",
        },
        remarks: {
            type: "string",
            allowNull: true,
        },
        receiptNo: {
            type: "string",
        },
        paymentImg: {
            type: "string",
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
