const { ObjectId } = require("mongodb");

module.exports = {
    // Quotation-aging buckets, in display order. Keys are stable identifiers;
    // labels are human-facing.
    AGING_BUCKETS: [
        { key: "0-7", label: "0-7 days" },
        { key: "8-30", label: "8-30 days" },
        { key: "31-90", label: "31-90 days" },
        { key: "90plus", label: "90+ days" },
    ],

    /**
     * Group `clientitinerary` (quotations) in the given match window by agent
     * and by age bucket. Shared by quotationsByAgent + quotationAging so both
     * sections describe exactly the same set of records.
     */
    quotationSections: async function (match) {
        const manager = ClientItinerary.getDatastore().manager;
        const collection = manager.collection(ClientItinerary.tableName || "clientitinerary");
        const now = new Date();

        const [agentRows, ageRows] = await Promise.all([
            collection.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$salesExecutive",
                        total: { $sum: 1 },
                    },
                },
                { $sort: { total: -1, _id: 1 } },
            ]).toArray(),
            collection.aggregate([
                { $match: match },
                {
                    $project: {
                        ageDays: {
                            $floor: {
                                $divide: [{ $subtract: [now, "$createdAt"] }, 86400000],
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        b0_7: { $sum: { $cond: [{ $lte: ["$ageDays", 7] }, 1, 0] } },
                        b8_30: { $sum: { $cond: [{ $and: [{ $gt: ["$ageDays", 7] }, { $lte: ["$ageDays", 30] }] }, 1, 0] } },
                        b31_90: { $sum: { $cond: [{ $and: [{ $gt: ["$ageDays", 30] }, { $lte: ["$ageDays", 90] }] }, 1, 0] } },
                        b90plus: { $sum: { $cond: [{ $gt: ["$ageDays", 90] }, 1, 0] } },
                    },
                },
            ]).toArray(),
        ]);

        // Resolve agent ids -> display names in one query.
        const agentIds = agentRows.map((row) => row._id).filter((id) => id && ObjectId.isValid(String(id))).map((id) => String(id));
        const users = agentIds.length
            ? await User.find({ where: { id: agentIds }, select: ["id", "name", "username", "email"] })
            : [];
        const userMap = users.reduce((map, user) => {
            map[String(user.id)] = user.name || user.username || user.email || String(user.id);
            return map;
        }, {});

        const quotationsByAgent = agentRows.map((row) => ({
            user: row._id ? (userMap[String(row._id)] || String(row._id)) : "Unassigned",
            id: row._id ? String(row._id) : null,
            total: Number(row.total || 0),
        }));

        const counts = ageRows[0] || {};
        const quotationAging = this.AGING_BUCKETS.map((bucket) => {
            const total =
                bucket.key === "0-7" ? counts.b0_7 :
                bucket.key === "8-30" ? counts.b8_30 :
                bucket.key === "31-90" ? counts.b31_90 :
                counts.b90plus;
            return { bucket: bucket.key, label: bucket.label, total: Number(total || 0) };
        });

        return { quotationsByAgent, quotationAging };
    },

    /**
     * Real analytics for the dashboard performance view: assignments by agent
     * (booked in the range by `bookingDate`) and quotations by agent + aging
     * (created in the range by `createdAt`). All counts come from Mongo
     * aggregation over the caller's active company — no synthetic values.
     */
    performance: function (ctx, period) {
        return new Promise(async (resolve, reject) => {
            try {
                const company = String(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id || "");
                if (!company || !ObjectId.isValid(company)) {
                    return reject({ statusCode: 400, error: { message: "company id is required!" } });
                }

                const manager = Assignment.getDatastore().manager;
                const assignmentCollection = manager.collection(Assignment.tableName || "assignment");

                const assignmentMatch = {
                    company: new ObjectId(company),
                    isDeleted: { $ne: true },
                    bookingDate: {
                        $gte: period.start.toDate(),
                        $lte: period.end.toDate(),
                    },
                };

                const quotationMatch = {
                    company: new ObjectId(company),
                    isDeleted: { $ne: true },
                    createdAt: {
                        $gte: period.start.toDate(),
                        $lte: period.end.toDate(),
                    },
                };

                const [agentRows, quotationSections] = await Promise.all([
                    assignmentCollection.aggregate([
                        { $match: assignmentMatch },
                        {
                            $group: {
                                _id: "$agentName",
                                total: { $sum: 1 },
                            },
                        },
                        { $sort: { total: -1, _id: 1 } },
                    ]).toArray(),
                    this.quotationSections(quotationMatch),
                ]);

                // Resolve assignment agent ids -> display names in one query.
                const agentIds = agentRows.map((row) => row._id).filter((id) => id && ObjectId.isValid(String(id))).map((id) => String(id));
                const users = agentIds.length
                    ? await User.find({ where: { id: agentIds }, select: ["id", "name", "username", "email"] })
                    : [];
                const userMap = users.reduce((map, user) => {
                    map[String(user.id)] = user.name || user.username || user.email || String(user.id);
                    return map;
                }, {});

                const assignmentsByAgent = agentRows.map((row) => ({
                    user: row._id ? (userMap[String(row._id)] || String(row._id)) : "Unassigned",
                    id: row._id ? String(row._id) : null,
                    total: Number(row.total || 0),
                }));

                return resolve({
                    period: { from: period.from, to: period.to, days: period.days },
                    assignmentsByAgent,
                    quotationsByAgent: quotationSections.quotationsByAgent,
                    quotationAging: quotationSections.quotationAging,
                });
            } catch (error) {
                return reject(error?.statusCode ? error : { statusCode: 500, error });
            }
        });
    },

    getSummary: function (ctx, filter, period) {
        return new Promise(async (resolve, reject) => {
            if (!filter) {
                filter = {};
            }
            // if (!filter.company) {
            //     filter.company = ctx?.session?.activeCompany?.id;
            // }

            // if (!filter.company) {
            //     return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            // }

            // Pristine copy of the caller's filter. The per-model count services
            // below MUTATE the filter object they receive (e.g. injecting
            // isDeleted/company), so series/previous-period counts must always
            // start from an untouched copy to reproduce the same per-metric
            // scoping the legacy top-level counts produce.
            const pristineFilter = { ...filter };

            let data = {
                itineraries: 0,
                areas : 0,
                sites: 0,
                hotels: 0,
                hotelCategories: 0,
                users: 0
            }
            try {
                data.itineraries = await ItineraryService.count(ctx, filter);
                data.areas = await AreaService.count(ctx, filter);
                data.sites = await SiteService.count(ctx, filter);
                data.hotels = await HotelService.count(ctx, filter);
                data.hotelCategories = await HotelCategoryService.count(ctx, filter);
                data.users = await UserService.count(ctx, filter);

            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }

            // Percentage change between two period counts. Null when the previous
            // count is zero (unless both are zero, which is reported as 0).
            const percentChange = (current, previous) => {
                if (!previous) return current ? null : 0;
                return Math.round(((current - previous) / previous) * 10000) / 100;
            };

            // Count every metric over a day range using the same sequential
            // shared-filter pattern as the legacy top-level counts, so each
            // service sees (and mutates) the filter identically.
            const countMetricsForRange = async (start, end) => {
                const rangeFilter = { ...pristineFilter, createdAt: { '>=': start.toDate(), '<=': end.toDate() } };
                const result = {};
                result.itineraries = await ItineraryService.count(ctx, rangeFilter);
                result.areas = await AreaService.count(ctx, rangeFilter);
                result.sites = await SiteService.count(ctx, rangeFilter);
                result.hotels = await HotelService.count(ctx, rangeFilter);
                result.hotelCategories = await HotelCategoryService.count(ctx, rangeFilter);
                result.users = await UserService.count(ctx, rangeFilter);
                return result;
            };

            // Additive, backward-compatible enrichment: only when a date period
            // was supplied (controller passes `period`, otherwise null).
            if (period) {
                try {
                    const dayjs = sails.dayjs;
                    const days = period.days;

                    // Previous period of the same length immediately before `from`.
                    const prevStart = period.start.startOf('day').subtract(days, 'day');
                    const prevEnd = period.start.startOf('day').subtract(1, 'day').endOf('day');

                    // Daily series across the selected range (inclusive).
                    const series = [];
                    for (let i = 0; i < days; i++) {
                        const dayStart = period.start.startOf('day').add(i, 'day');
                        const dayEnd = dayStart.endOf('day');
                        const counts = await countMetricsForRange(dayStart, dayEnd);
                        series.push({ date: dayStart.format('YYYY-MM-DD'), ...counts });
                    }

                    const previous = await countMetricsForRange(prevStart, prevEnd);

                    const comparison = {};
                    Object.keys(data).forEach((name) => {
                        comparison[name] = {
                            current: data[name] || 0,
                            previous: previous[name] || 0,
                            change: percentChange(data[name] || 0, previous[name] || 0)
                        };
                    });

                    data.period = { from: period.start.format('YYYY-MM-DD'), to: period.end.format('YYYY-MM-DD'), days };
                    data.previousPeriod = { from: prevStart.format('YYYY-MM-DD'), to: prevEnd.format('YYYY-MM-DD') };
                    data.comparison = comparison;
                    data.series = series;
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                // No period requested: keep the legacy all-time counts and add an
                // explicit no-period shape so clients can feature-detect.
                data.period = null;
                data.previousPeriod = null;
                data.comparison = null;
                data.series = [];
            }

            return resolve(data);
        })
    },

}
