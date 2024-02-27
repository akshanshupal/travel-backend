const https = require('https');
const fs = require('fs');
module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },
    uploadFile1: async function(req,res){
        const uploadedFile = req.file('fmFile');
        if (!uploadedFile || !uploadedFile._files[0]) {
            return res.status(400).send('No files were uploaded.');
          }


        const REGION = 'sg'; // If German region, set this to an empty string: ''
        const BASE_HOSTNAME = 'storage.bunnycdn.com';
        const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
        const STORAGE_ZONE_NAME = 'travelindia';
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
    
            const file = uploadedFile._files[0];
    
            const REGION = 'sg'; // If German region, set this to an empty string: ''
            const BASE_HOSTNAME = 'storage.bunnycdn.com';
            const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
            const STORAGE_ZONE_NAME = 'travelindia/hotel';
            
            // Properly URL encode the filename
            const FILENAME_TO_UPLOAD = encodeURIComponent(file.stream.filename.replace(/[^a-zA-Z0-9-,\(/\)/.#_]/g, ''));
    
            const apiKey = 'b6bfc78f-fbf2-433e-8c126772b417-d897-4d95';
    
            const options = {
                method: 'PUT',
                host: HOSTNAME,
                path: `/${STORAGE_ZONE_NAME}/${FILENAME_TO_UPLOAD}`,
                headers: {
                    AccessKey: apiKey,
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
                    console.log(data);
                    res.ok('File uploaded successfully.');
                });
            });
    
            uploadReq.on('error', (error) => {
                console.error(error);
                res.serverError('Internal Server Error');
            });
    
            // Pipe the file stream directly to the HTTP request
            file.stream.pipe(uploadReq);
        } catch (error) {
            console.error('Error uploading file:', error);
            res.serverError('Internal Server Error');
        }
    },
    
    
    
}
