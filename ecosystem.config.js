module.exports = {
    apps : [
        {   
            name: 'travel-project',
            script: './app.js',
            watch: false,
            "instances": "2",
            "exec_mode": "cluster",
        }, 
    ],
  };