const https = require('https');
const fs = require('fs');
const fetch = require('node-fetch');
module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },
    uploadFile1: async function(req,res){
        const uploadedFile = req.file('fmFile');
        if (!uploadedFile || !uploadesdFile._files[0]) {
            return res.status(400).send('No files were uploaded.');
          }


        const REGION = 'sg'; // If German region, set this to an empty string: ''
        const BASE_HOSTNAME = 'storage.bunnycdn.com';
        const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
        const STORAGE_ZONE_NAME = 'travelimg';
        const FILENAME_TO_UPLOAD = (uploadedFile._files[0].stream.filename.replace(/[^a-zA-Z0-9-,\(/\)/.#_]/g, '').split('.')).join(' ');
        const FILE_PATH = uploadedFile._files[0].path;


        const uploadFile = async () => {
        const readStream = fileh;

        const options = {
            method: 'PUT',
            host: HOSTNAME,
            path: `/${STORAGE_ZONE_NAME}/${FILENAME_TO_UPLOAD}`,
            headers: {
            AccessKey: ACCESS_KEY,
            'Content-Type': 'application/octet-stream',
            },
        };

        const req = https.request(options, (res) => {
            res.on('data', (chunk) => {
            console.log(chunk.toString('utf8'));
            });
        });

        req.on('error', (error) => {
            console.error(error);
        });

        readStream.pipe(req);
        };
        await uploadFile()
    },
    uploadFile: async function(req, res) {
        try {
            // Assuming you are using the 'skipper-s3' adapter for file uploads
            const uploadedFile = req.file('fmFile');
    
            if (!uploadedFile || !uploadedFile._files[0]) {
                return res.status(400).send('No files were uploaded.');
            }
            let folder;
            if(req.body?.folder){
                folder= req.body?.folder;
            }
    
            const file = uploadedFile._files[0];
    
            const REGION = sails.config.bunnyCDN.REGION ; // If German region, set this to an empty string: ''
            const BASE_HOSTNAME = sails.config.bunnyCDN.BASE_HOSTNAME;
            const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
            let STORAGE_ZONE_NAME = sails.config.bunnyCDN.STORAGE_ZONE_NAME;
            if(folder){
                STORAGE_ZONE_NAME = `travelimg/${folder}`;
            }            
            // Properly URL encode the filename
            const FILENAME_TO_UPLOAD = encodeURIComponent(file.stream.filename.replace(/[^a-zA-Z0-9-,\(/\)/.#_]/g, ''));
    
            // const apiKey = 'b6bfc78f-fbf2-433e-8c126772b417-d897-4d95';
    
            const options = {
                method: 'PUT',
                host: HOSTNAME,
                path: `/${STORAGE_ZONE_NAME}/${FILENAME_TO_UPLOAD}`,
                headers: {
                    AccessKey: sails.config.bunnyCDN.PASSWORD,
                    'Content-Type': 'application/octet-stream',
                },
            };
    
            const uploadReq = https.request(options, (response) => {
                let data = '';
    
                response.on('data', (chunk) => {
                    console.log(chunk.toString('utf8'), 'jhb');

                    data += chunk;
                });
    
                response.on('end', () => {
                    if(!folder){
                        res.ok(`${sails.config.bunnyCDN.baseUrl}/${FILENAME_TO_UPLOAD}`);
                    }else{
                        res.ok(`${sails.config.bunnyCDN.baseUrl}/${folder}/${FILENAME_TO_UPLOAD}`);
                    }
                });
                response.on('error', (error) => {
                    console.error(error);
                    res.serverError('Internal Server Error');
                });
            });
    
            // Pipe the file stream directly to the HTTP request
            file.stream.pipe(uploadReq);
        } catch (error) {
            console.error('Error uploading file:', error);
            res.serverError('Internal Server Error');
        }
    },
    deleteFile: async function(req, res) {
        try {
            // Assuming you are using the 'skipper-s3' adapter for file uploads
    
            if (!req.body.fileUrl) {
                return res.status(400).send('fileUrl is missing');
            }   
            function removeBaseUrl(fileUrl) {
                // Define the base URL
                const baseUrl = `${sails.config.bunnyCDN.baseUrl}/`;
                let x = fileUrl.replace(new RegExp('^' + baseUrl), '');
              
                // Use regular expression to replace the base URL if it appears after 'https://'
                return x
            }
            let FILENAME_TO_UPLOAD = removeBaseUrl(req.body.fileUrl);

            const REGION = sails.config.bunnyCDN.REGION ; // If German region, set this to an empty string: ''
            const BASE_HOSTNAME = sails.config.bunnyCDN.BASE_HOSTNAME;
            const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;


            const url = `https://${HOSTNAME}/${sails.config.bunnyCDN.STORAGE_ZONE_NAME}/${FILENAME_TO_UPLOAD}`;
            const headers = new Headers();
            headers.append('AccessKey', sails.config.bunnyCDN.PASSWORD);
            const options = {
                method: 'DELETE',
                headers: headers,
            };
            
            fetch(url, options)
              .then(
                res => res.json()
                )
              .then(json =>{
                let x = json;

                  console.log(json);
                  res.json(json)
              } 
                )
              .catch(err =>  res.serverError('Internal Server Error'));
    
        } catch (error) {
            console.error('Error uploading file:', error);
            res.serverError('Internal Server Error');
        }
    },
    
    
    
}
