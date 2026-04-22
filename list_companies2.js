const sails = require('sails');
sails.load({ environment: 'development' }, function(err) {
  if (err) return console.error(err);
  sails.models.company.find({}).exec(function(err, companies) {
    if (err) console.error(err);
    else companies.forEach(c => console.log(c.name, c.id));
    sails.lower();
  });
});
