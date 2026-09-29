module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    /**
     * Shared YYYY-MM-DD validation/period resolution for dashboard endpoints.
     * Returns { start, end, days, from, to } dayjs/day bounds, or { errors }.
     */
    _resolvePeriod: function ({ from, to }) {
        const dateRe = /^\d{4}-\d{2}-\d{2}$/;
        // Round-trip check: guards against lenient parsing rolling invalid
        // dates like `2026-13-45` or `2026-02-30` onto real dates.
        const isValidDate = (value) => {
            if (!dateRe.test(value)) return false;
            const parsed = sails.dayjs(value);
            return parsed.isValid() && parsed.format('YYYY-MM-DD') === value;
        };
        const errors = [];
        if (!from || !isValidDate(from)) errors.push("`from` must be a valid date in YYYY-MM-DD format.");
        if (!to || !isValidDate(to)) errors.push("`to` must be a valid date in YYYY-MM-DD format.");
        if (errors.length) return { errors };

        const start = sails.dayjs(from, 'YYYY-MM-DD').startOf('day');
        const end = sails.dayjs(to, 'YYYY-MM-DD').endOf('day');
        if (start.isAfter(end)) {
            errors.push("`from` must be on or before `to`.");
            return { errors };
        }
        const days = end.diff(start, 'day') + 1;
        if (days > 366) {
            errors.push("Date range too large: the maximum supported period is 366 days.");
            return { errors };
        }
        return { start, end, days, from, to };
    },

    /**
     * GET /api/dashboard/performance?from=YYYY-MM-DD&to=YYYY-MM-DD
     * Assignments by agent (bookingDate in range), quotations by agent
     * (createdAt in range) and quotation aging buckets. Real aggregation only.
     */
    performance: async function (req, res) {
        const { from, to } = req.query;
        const resolved = module.exports._resolvePeriod({ from, to });
        if (resolved.errors) {
            return res.status(400).send({ message: resolved.errors.join(' ') });
        }
        try {
            const result = await DashboardService.performance(req, resolved);
            return res.json(result);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    getSummary: async function (req, res) {
        const { status, from, to } = req.query;

        // Optional date-range filtering. When neither param is supplied the
        // response keeps the legacy all-time shape (plus empty series/comparison).
        let period = null;
        if (from || to) {
            const dateRe = /^\d{4}-\d{2}-\d{2}$/;
            // Round-trip check: guards against lenient parsing rolling invalid
            // dates like `2026-13-45` or `2026-02-30` onto real dates.
            const isValidDate = (value) => {
                if (!dateRe.test(value)) return false;
                const parsed = sails.dayjs(value);
                return parsed.isValid() && parsed.format('YYYY-MM-DD') === value;
            };
            const errors = [];
            if (from && !isValidDate(from)) {
                errors.push("`from` must be a valid date in YYYY-MM-DD format.");
            }
            if (to && !isValidDate(to)) {
                errors.push("`to` must be a valid date in YYYY-MM-DD format.");
            }
            if (errors.length) {
                return res.status(400).send({ message: errors.join(' ') });
            }

            const start = from ? sails.dayjs(from, 'YYYY-MM-DD').startOf('day') : null;
            const end = to ? sails.dayjs(to, 'YYYY-MM-DD').endOf('day') : null;

            // Default the missing bound to a sensible single-window: `from` only
            // means from that day until today; `to` only means the 30 days up to
            // and including that day.
            const resolvedStart = start || (end ? end.subtract(29, 'day').startOf('day') : null);
            const resolvedEnd = end || (start ? sails.dayjs().endOf('day') : null);

            if (resolvedStart.isAfter(resolvedEnd)) {
                return res.status(400).send({ message: "`from` must be on or before `to`." });
            }

            const days = resolvedEnd.diff(resolvedStart, 'day') + 1;
            if (days > 366) {
                return res.status(400).send({ message: "Date range too large: the maximum supported period is 366 days." });
            }

            period = { start: resolvedStart, end: resolvedEnd, days };
        }

        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (period) {
            filter.createdAt = {
                '>=': period.start.toDate(),
                '<=': period.end.toDate()
            };
        }
        try {
            var summary = await DashboardService.getSummary(req, filter, period);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error);
        }
        return res.json(summary);
    }

};
