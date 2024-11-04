const axios = require('axios');
const fs = require('fs');
const { VisionServiceClient } = require('@google-cloud/vision');
const Photo = require('../models/PhotoSchema'); // Import the Photo model
const { OAuth2Client } = require('google-auth-library');

exports.uploadPhotos = async (req, res, oauth2Client) => {
  const files = req.files;
  const customTags = JSON.parse(req.body.customTags || '[]');

  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  try {
    const uploadResults = [];

    if (files.length !== customTags.length) {
      return res.status(400).send('Error: Each file must have a corresponding array of tags.');
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = file.path;
      const tagsForCurrentFile = Array.isArray(customTags[i]) ? customTags[i] : [customTags[i]];

      const stats = fs.statSync(filePath);
      const fileMetadata = {
        filename: file.originalname, // Ensure the filename is the original name
        size: stats.size,
        type: file.mimetype,
        uploadedAt: new Date(),
        customTags: tagsForCurrentFile,
      };

      console.log('File Metadata:', fileMetadata);

      const uploadUrl = 'https://photoslibrary.googleapis.com/v1/uploads';
      const headers = {
        Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
        'Content-Type': 'application/octet-stream',
        'X-Goog-Upload-Protocol': 'raw',
      };

      const fileData = fs.readFileSync(filePath);
      const uploadResponse = await axios.post(uploadUrl, fileData, { headers });
      const uploadToken = uploadResponse.data;

      const createMediaItemUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';
      const mediaItemRequest = {
        newMediaItems: [
          {
            description: `Uploaded via PhotoTaggerApp - ${file.originalname}`, // Setting description
            simpleMediaItem: {
              uploadToken: uploadToken,
            },
          },
        ],
      };

      await axios.post(createMediaItemUrl, mediaItemRequest, { headers });

      try {
        const photoDocument = new Photo(fileMetadata);
        await photoDocument.save();

        uploadResults.push({
          filename: file.originalname,
          status: 'Uploaded and saved successfully',
          customTags: fileMetadata.customTags,
        });
        console.log(`Saved metadata for ${file.originalname} to MongoDB`);
      } catch (dbError) {
        console.error(`Error saving ${file.originalname} metadata to MongoDB:`, dbError.message);
        uploadResults.push({
          filename: file.originalname,
          status: `Upload successful but failed to save metadata: ${dbError.message}`,
          customTags: fileMetadata.customTags,
        });
      }

      fs.unlinkSync(filePath); // Clean up file from local storage after upload
    }

    res.status(200).json({ message: 'Photos processed successfully', results: uploadResults });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).send('Error uploading photos: ' + error.message);
  }
};





exports.getGooglePhotos = async (req, res, oauth2Client) => {
  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  const { fromDate, toDate, location } = req.query;

  try {
    const photosUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
    };

    let filters = {};

    if (fromDate && toDate) {
      filters.dateFilter = {
        ranges: [
          {
            startDate: {
              year: parseInt(fromDate.split('-')[0]),
              month: parseInt(fromDate.split('-')[1]),
              day: parseInt(fromDate.split('-')[2]),
            },
            endDate: {
              year: parseInt(toDate.split('-')[0]),
              month: parseInt(toDate.split('-')[1]),
              day: parseInt(toDate.split('-')[2]),
            },
          },
        ],
      };
    }

    const response = await axios.post(
      photosUrl,
      { filters },
      { headers }
    );

    const photos = response.data.mediaItems || [];

    const filteredPhotos = location
      ? photos.filter(photo => {
          return photo.location && photo.location.includes(location);
        })
      : photos;

    const photoDetails = filteredPhotos.map((photo) => ({
      id: photo.id,
      url: photo.baseUrl,
      filename: photo.filename,
      creationTime: photo.mediaMetadata.creationTime || null, 
    }));

    res.status(200).json(photoDetails);
  } catch (error) {
    console.error('Error fetching Google Photos:', error);
    res.status(500).send('Error fetching photos from Google Photos');
  }
};

exports.getUserProfile = async (req, res, oauth2Client) => {
  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  console.log('Access Token:', oauth2Client.credentials.access_token);

  try {
    const peopleUrl = 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,birthdays,photos';
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
    };

    const response = await axios.get(peopleUrl, { headers });
    const profileData = response.data;

    // console.log('Google People API Response:', profileData);

    const user = {
      name: profileData.names && profileData.names.length > 0 ? profileData.names[0].displayName : 'N/A',
      email: profileData.emailAddresses && profileData.emailAddresses.length > 0 ? profileData.emailAddresses[0].value : 'N/A',
      birthday: profileData.birthdays && profileData.birthdays.length > 0 ? profileData.birthdays[0].date : null,
      profilePic: profileData.photos && profileData.photos.length > 0 ? profileData.photos[0].url : null,
    };    

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error.response ? error.response.data : error.message);
    res.status(500).send('Error fetching user profile');
  }
};

// Import the ImageAnnotatorClient from the Vision API
const { ImageAnnotatorClient } = require('@google-cloud/vision'); // Ensure this is added
const path = require('path');

// Your existing code...
// exports.searchPhotos = async (req, res) => {
//   console.log("Search Photos Request Received", req.body); // Log the incoming request
//   const { searchTerm, photos } = req.body;

//   if (!searchTerm || !photos || photos.length === 0) {
//     return res.status(400).send('Search term and photos are required.');
//   }

//   try {
//     const client = new ImageAnnotatorClient({
//       keyFilename: path.join(__dirname, 'sigma-archery-437616-m1-b0567f5f6e5c.json'), // Adjust the path if necessary
//     });

//     const matchingPhotos = [];

//     for (const photo of photos) {
//       console.log(`Analyzing photo: ${photo.url}`); // Log each photo being analyzed
//       const [result] = await client.labelDetection(photo.url); // Call Vision API for label detection
//       const labels = result.labelAnnotations.map(label => label.description.toLowerCase());

//       if (labels.includes(searchTerm.toLowerCase())) {
//         matchingPhotos.push(photo); // If the label matches the search term, add the photo
//       }
//     }

//     res.status(200).json(matchingPhotos); // Return matching photos
//   } catch (error) {
//     console.error('Error searching photos:', error);
//     res.status(500).send('Error searching photos');
//   }
// };
exports.searchPhotos = async (req, res, oauth2Client) => {
  const { searchTerm } = req.body;
  console.log('Received search term:', searchTerm);

  if (!oauth2Client.credentials?.access_token) {
    return res.status(401).json({ error: 'No access token. Please log in again.' });
  }

  try {
    // Step 1: Search in MongoDB for matching photos by filename or customTags
    const matchedPhotos = await Photo.find({
      $or: [
        { filename: { $regex: searchTerm, $options: 'i' } },
        { customTags: { $regex: searchTerm, $options: 'i' } }
      ]
    });

    console.log('Matched photos from MongoDB:', matchedPhotos);

    // Get filenames from the matched MongoDB records
    const matchedFilenames = matchedPhotos.map(photo => photo.filename);
    if (matchedFilenames.length === 0) {
      return res.status(200).json([]); // No matches found
    }

    // Step 2: Retrieve images from Google Photos API and filter by description
    const photosUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
    };

    const googlePhotos = [];
    try {
      // Make a single API call to retrieve recent photos from Google Photos
      const response = await axios.post(
        photosUrl,
        { 
          filters: { mediaTypeFilter: { mediaTypes: ["PHOTO"] } }
        },
        { headers }
      );

      console.log('Google Photos API response:', response.data);

      // Filter photos returned by Google Photos to match filenames in descriptions
      const photos = response.data.mediaItems || [];
      const matchedGooglePhotos = photos.filter(photo => 
        matchedFilenames.some(filename => photo.description?.includes(filename))
      );

      googlePhotos.push(...matchedGooglePhotos);
    } catch (photoError) {
      console.error('Error fetching photos from Google Photos:', photoError);
    }

    // Step 3: Format response data
    const photoDetails = googlePhotos.map((photo) => ({
      url: `${photo.baseUrl}=w500-h500`, // Resize as needed
      filename: photo.filename,
      creationTime: photo.mediaMetadata?.creationTime || null,
      description: photo.description || 'No description',
    }));

    // Send formatted data back to client
    res.status(200).json(photoDetails);
  } catch (error) {
    console.error('Error searching photos:', error);
    res.status(500).json({ error: 'Error fetching photos from Google Photos' });
  }
};

exports.getPhotoDetails = async (req, res, oauth2Client) => {
  const { photoId } = req.params;
  console.log("PHOTO ID: "+photoId);
  if (!oauth2Client.credentials.access_token) {
    return res.status(401).json({ error: 'Unauthorized: No access token provided' });
  }

  try {
    const photoDetailsUrl = `https://photoslibrary.googleapis.com/v1/mediaItems/${photoId}`;
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
    };

    const response = await axios.get(photoDetailsUrl, { headers });
    const photoData = response.data;

    const photoDetails = {
      id: photoData.id,
      url: photoData.baseUrl,
      filename: photoData.filename,
      description: photoData.description || 'No description',
      creationTime: photoData.mediaMetadata.creationTime,
      width: photoData.mediaMetadata.width,
      height: photoData.mediaMetadata.height,
      mimeType: photoData.mimeType,
    };

    res.status(200).json(photoDetails);
  } catch (error) {
    console.error('Error fetching photo details:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching photo details from Google Photos' });
  }
};

exports.getPhotoByFileName = async (req, res) => {
  try {
    const { description } = req.query;
    
    // Ensure description is provided
    if (!description) {
      return res.status(400).json({ error: 'Description query parameter is required' });
    }

    // const filename = description.split(' - ')[1]; // Extract filename
    const filename = 'orange.jpg'; // Extract filename

    // Check if filename is valid
    if (!filename) {
      return res.status(400).json({ error: 'Filename could not be extracted from description' });
    }

    const photo = await Photo.findOne({ filename });
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
};


exports.getPhotoDetailsWithTags = async (req, res, oauth2Client) => {
  const { photoId } = req.params;
  console.log("PHOTO ID:", photoId);

  if (!oauth2Client.credentials.access_token) {
    return res.status(401).json({ error: 'Unauthorized: No access token provided' });
  }

  try {
    // Step 1: Fetch the photo details from Google Photos
    const photoDetailsUrl = `https://photoslibrary.googleapis.com/v1/mediaItems/${photoId}`;
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
    };

    const response = await axios.get(photoDetailsUrl, { headers });
    const photoData = response.data;

    // Step 2: Extract filename from the description
    const filename = photoData.description ? photoData.description.split(' - ')[1] : null;
    if (!filename) {
      console.error('Filename not found in description');
      return res.status(200).json({
        photoDetails: {
          id: photoData.id,
          url: photoData.baseUrl,
          filename: photoData.filename,
          description: photoData.description || 'No description',
          creationTime: photoData.mediaMetadata.creationTime,
          width: photoData.mediaMetadata.width,
          height: photoData.mediaMetadata.height,
          mimeType: photoData.mimeType,
        },
        customTags: [] // No tags if filename extraction fails
      });
    }

    // Step 3: Fetch custom tags based on the filename
    const photoRecord = await Photo.findOne({ filename });
    const customTags = photoRecord ? photoRecord.customTags : [];

    // Step 4: Combine photo details with custom tags and send response
    const photoDetails = {
      id: photoData.id,
      url: photoData.baseUrl,
      filename: photoData.filename,
      description: photoData.description || 'No description',
      creationTime: photoData.mediaMetadata.creationTime,
      width: photoData.mediaMetadata.width,
      height: photoData.mediaMetadata.height,
      mimeType: photoData.mimeType,
    };

    res.status(200).json({ photoDetails, customTags });
  } catch (error) {
    console.error('Error fetching photo details:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching photo details from Google Photos' });
  }
};
