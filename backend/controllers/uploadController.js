const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Function to upload photo to Google Photos
exports.uploadPhoto = async (req, res, oauth2Client) => {
  const filePath = req.file.path;

  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  try {
    const uploadUrl = 'https://photoslibrary.googleapis.com/v1/uploads';
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
      'Content-Type': 'application/octet-stream',
      'X-Goog-Upload-Protocol': 'raw',
    };

    const fileData = fs.readFileSync(filePath);
    const uploadToken = await axios.post(uploadUrl, fileData, { headers });

    const createMediaItemUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';
    const mediaItemRequest = {
      newMediaItems: [
        {
          description: 'Uploaded via PhotoTaggerApp',
          simpleMediaItem: {
            uploadToken: uploadToken.data,
          },
        },
      ],
    };

    await axios.post(createMediaItemUrl, mediaItemRequest, { headers });
    res.send('Photo uploaded successfully to Google Photos!');
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).send('Error uploading photo');
  } finally {
    fs.unlinkSync(filePath);
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
