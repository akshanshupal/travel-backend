
module.exports = {
    getSummary: function (ctx, filter) {
        return new Promise(async (resolve, reject) => {
            if (!filter) {
                filter = {};
            }
            if (!filter.company) {
                filter.company = ctx?.session?.activeCompany?.id;
            }
            
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }

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
            return resolve(data);
        })
    },

}
