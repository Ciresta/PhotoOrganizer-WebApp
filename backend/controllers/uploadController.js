const axios = require('axios');
const fs = require('fs');

// Function to upload multiple photos to Google Photos
exports.uploadPhotos = async (req, res, oauth2Client) => {
  const files = req.files; // Access the array of uploaded files

  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  try {
    const uploadResults = [];

    // Loop through each uploaded file and upload it to Google Photos
    for (let file of files) {
      const filePath = file.path;

      // Step 1: Upload the file to Google Photos and get the upload token
      const uploadUrl = 'https://photoslibrary.googleapis.com/v1/uploads';
      const headers = {
        Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
        'Content-Type': 'application/octet-stream',
        'X-Goog-Upload-Protocol': 'raw',
      };

      const fileData = fs.readFileSync(filePath);
      const uploadResponse = await axios.post(uploadUrl, fileData, { headers });

      const uploadToken = uploadResponse.data;

      // Step 2: Create a media item using the upload token
      const createMediaItemUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';
      const mediaItemRequest = {
        newMediaItems: [
          {
            description: 'Uploaded via PhotoTaggerApp',
            simpleMediaItem: {
              uploadToken: uploadToken,
            },
          },
        ],
      };

      await axios.post(createMediaItemUrl, mediaItemRequest, { headers });

      // Step 3: Store the result (filename and status) in an array to send back
      uploadResults.push({
        filename: file.originalname,
        status: 'Uploaded successfully',
      });

      // Step 4: Clean up by deleting the uploaded file from the server
      fs.unlinkSync(filePath);
    }

    // Step 5: Send the result of all uploads back to the client
    res.status(200).json({ message: 'Photos uploaded successfully', results: uploadResults });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).send('Error uploading photos');
  }
};

// Function to get photos from Google Photos
exports.getGooglePhotos = async (req, res, oauth2Client) => {
  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  try {
    const photosUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems';
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
    };

    // Retrieve the list of photos
    const response = await axios.get(photosUrl, { headers });
    const photos = response.data.mediaItems || [];

    // Send the photo URLs to the frontend
    const photoUrls = photos.map((photo) => ({
      url: photo.baseUrl,
      filename: photo.filename,
    }));

    res.status(200).json(photoUrls);
  } catch (error) {
    console.error('Error fetching Google Photos:', error);
    res.status(500).send('Error fetching photos from Google Photos');
  }
};
