const https = require('https');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

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
            let STORAGE_ZONE_NAME = sails.config.bunnyCDN.STORAGE_ZONE_NAME;
            if(folder){
                STORAGE_ZONE_NAME = `travelimg/${folder}`;
            }            
            // Properly URL encode the filename

            let FILENAME_TO_UPLOAD = encodeURIComponent(file.stream.filename.replace(/[^a-zA-Z0-9-,\(/\)/.#_]/g, ''));
            const urlParts = FILENAME_TO_UPLOAD.split('.');
            const newUrl = `${urlParts.slice(0, -1).join('.')}_${new Date().getTime()}.${urlParts[urlParts.length - 1]}`;

            FILENAME_TO_UPLOAD = newUrl;
    
            const options = {
                method: 'PUT',
                host: sails.config.bunnyCDN.HOSTNAME,
                path: `/${STORAGE_ZONE_NAME}/${FILENAME_TO_UPLOAD}`,
                headers: {
                    AccessKey: sails.config.bunnyCDN.PASSWORD,
                    'Content-Type': 'application/octet-stream',
                },
            };
            console.log(options)
    
            const uploadReq = https.request(options, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    console.log(chunk.toString('utf8'), 'jhb');

                    data += chunk;
                });
                response.on('end', () => {
                    if(!folder){
                        console.log('file uploaded')

                        res.ok(`${sails.config.bunnyCDN.baseUrl}/${FILENAME_TO_UPLOAD}`);
                    }else{

                        res.ok(`${sails.config.bunnyCDN.baseUrl}/${folder}/${FILENAME_TO_UPLOAD}`);
                    }
                });
                response.on('error', (error) => {
                    console.log(error)
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
    
            if (!req.body.url) {
                return res.status(400).send('fileUrl is missing');
            }   
            function removeBaseUrl(fileUrl) {
                const baseUrl = `${sails.config.bunnyCDN.baseUrl}/`;
                let x = fileUrl.replace(new RegExp('^' + baseUrl), '');              
                return x
            }
            let FILENAME_TO_UPLOAD = removeBaseUrl(req.body.url);
            const HOSTNAME = sails.config.bunnyCDN.HOSTNAME


            const pathUrl = `https://${HOSTNAME}/${sails.config.bunnyCDN.STORAGE_ZONE_NAME}/${FILENAME_TO_UPLOAD}`;
            const headers = new Headers();
            headers.append('AccessKey', sails.config.bunnyCDN.PASSWORD);
            const options = {
                method: 'DELETE',
                headers: headers,
            };
            
            fetch(pathUrl, options)
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
            console.error('Error deleting file:', error);
            res.serverError('Internal Server Error');
        }
    },
    updateHotelImages: async function(req, res) {
        async function uploadToBunnyCDN(filePath, folder, imagePath) {
            const STORAGE_ZONE_NAME = `travelimg/${folder}`;
            const FILENAME_TO_UPLOAD = encodeURIComponent(imagePath);            
            const options = {
                method: 'PUT',
                host: sails.config.bunnyCDN.HOSTNAME,
                path: `/${STORAGE_ZONE_NAME}/${FILENAME_TO_UPLOAD}`,
                headers: {
                AccessKey: sails.config.bunnyCDN.PASSWORD,
                'Content-Type': 'application/octet-stream',
                },
            };
            
            return new Promise((resolve, reject) => {
                const uploadReq = https.request(options, (response) => {
                let data = '';
            
                response.on('data', (chunk) => {
                    data += chunk;
                });
            
                response.on('end', () => {
                    if (response.statusCode === 201 || response.statusCode === 200) {
                        resolve();
                    } else {
                        reject(new Error(`Failed to upload image: ${data}`));
                    }
                });
            
                response.on('error', reject);
                });
            
                fs.createReadStream(filePath).pipe(uploadReq);
            });
        }
    
        async function downloadImage(url, filePath) {
            return new Promise((resolve, reject) => {
                const file = fs.createWriteStream(filePath);
                https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
                }).on('error', (err) => {
                fs.unlink(filePath, () => reject(err));
                });
            });
        }
        
            // Function to process each image
            const processImage = async (hotelImage) => {
                const folder = `sites`;
                let oldUrl = hotelImage.featureImg;
                const imagePath = oldUrl.split('/').pop();
                const localFilePath = path.join(downloadDir, encodeURIComponent(imagePath).replace(/\//g, '_'));


                try {
                    if(oldUrl.includes('https://trailkart.in')){
                        oldUrl= oldUrl.replace('https://trailkart.in', '')
                    }
                    // Download the image to a local file
                    await downloadImage(`https://thetripbliss.com${oldUrl}`, localFilePath);
            
                    // Upload the image to BunnyCDN
                    await uploadToBunnyCDN(localFilePath, folder, imagePath);
            
                    // Delete the local file if it exists
                    // if (fs.existsSync(localFilePath)) {
                    //   fs.unlinkSync(localFilePath);
                    //   console.log(`Deleted local file: ${localFilePath}`);
                    // } else {
                    //   console.log(`File not found for deletion: ${localFilePath}`);
                    // }
            
                    // Update the image URL in the database
                    const newUrl = `${sails.config.bunnyCDN.baseUrl}/${folder}/${encodeURIComponent(imagePath)}`;
                    await Site.update({ id: hotelImage.id }).set({ featureImg: newUrl, uploaded: true });
                    console.log(`Updated image URL for hotel image ID: ${hotelImage.id}`);
                  } catch (error) {
                    console.error(`Error processing image for hotel image ID: ${hotelImage.id}`, error);
                  }


            };
            const downloadDir = path.join(__dirname, '../../downloads');
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir);
            }
    
            try {
                // Create a directory for downloaded images if it doesn't exist

        
                // Fetch hotel images that haven't been uploaded yet
                const hotelImages = await Site.find({ uploaded: { '!=': 'true' } }).limit(10000);
        
                // Process images in chunks of 100
                const chunkSize = 100;
                for (let i = 0; i < hotelImages.length; i += chunkSize) {
                        const chunk = hotelImages.slice(i, i + chunkSize);
                        await Promise.all(chunk.map(processImage));
                        console.log(`Processed chunk ${i / chunkSize + 1}`);
                }
                 console.log('All hotel images updated successfully.');
                return res.ok('All hotel images updated successfully.');
            } catch (error) {
                console.error('Error updating hotel images:', error);
                return res.serverError('Internal Server Error');
            }
        }
    }
