const sails = require('sails');
sails.load({ environment: 'development' }, function(err) {
  if (err) return console.error(err);
  sails.models.companyconfig.find({}).exec(function(err, configs) {
    if (err) console.error(err);
    else configs.forEach(c => console.log(c.websiteUrls));
    sails.lower();
  });
});
