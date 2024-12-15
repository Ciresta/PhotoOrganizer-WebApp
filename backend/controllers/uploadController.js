const axios = require('axios');
const fs = require('fs');
const { VisionServiceClient } = require('@google-cloud/vision');
const Photo = require('../models/PhotoSchema'); // Import the Photo model
const Slideshow = require('../models/SlideshowSchema'); // Import the Photo model
const Gallery = require('../models/GallerySchema'); // Import the Photo model
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');

// exports.uploadPhotos = async (req, res, oauth2Client) => {
//   const files = req.files;
//   const customTags = JSON.parse(req.body.customTags || '[]');

//   if (!oauth2Client.credentials.access_token) {
//     return res.status(401).send('Unauthorized: No access token provided');
//   }

//   try {
//     const uploadResults = [];

//     if (files.length !== customTags.length) {
//       return res.status(400).send('Error: Each file must have a corresponding array of tags.');
//     }

//     for (let i = 0; i < files.length; i++) {
//       const file = files[i];
//       const filePath = file.path;
//       const tagsForCurrentFile = Array.isArray(customTags[i]) ? customTags[i] : [customTags[i]];

//       const stats = fs.statSync(filePath);
//       const fileMetadata = {
//         filename: file.originalname, // Ensure the filename is the original name
//         size: stats.size,
//         type: file.mimetype,
//         uploadedAt: new Date(),
//         customTags: tagsForCurrentFile,
//       };

//       console.log('File Metadata:', fileMetadata);

//       const uploadUrl = 'https://photoslibrary.googleapis.com/v1/uploads';
//       const headers = {
//         Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
//         'Content-Type': 'application/octet-stream',
//         'X-Goog-Upload-Protocol': 'raw',
//       };

//       const fileData = fs.readFileSync(filePath);
//       const uploadResponse = await axios.post(uploadUrl, fileData, { headers });
//       const uploadToken = uploadResponse.data;

//       const createMediaItemUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';
//       const mediaItemRequest = {
//         newMediaItems: [
//           {
//             description: `Uploaded via PhotoTaggerApp - ${file.originalname}`, // Setting description
//             simpleMediaItem: {
//               uploadToken: uploadToken,
//             },
//           },
//         ],
//       };

//       await axios.post(createMediaItemUrl, mediaItemRequest, { headers });

//       try {
//         const photoDocument = new Photo(fileMetadata);
//         await photoDocument.save();

//         uploadResults.push({
//           filename: file.originalname,
//           status: 'Uploaded and saved successfully',
//           customTags: fileMetadata.customTags,
//         });
//         console.log(`Saved metadata for ${file.originalname} to MongoDB`);
//       } catch (dbError) {
//         console.error(`Error saving ${file.originalname} metadata to MongoDB:`, dbError.message);
//         uploadResults.push({
//           filename: file.originalname,
//           status: `Upload successful but failed to save metadata: ${dbError.message}`,
//           customTags: fileMetadata.customTags,
//         });
//       }

//       fs.unlinkSync(filePath); // Clean up file from local storage after upload
//     }

//     res.status(200).json({ message: 'Photos processed successfully', results: uploadResults });
//   } catch (error) {
//     console.error('Error uploading photos:', error);
//     res.status(500).send('Error uploading photos: ' + error.message);
//   }
// };

// ---------------new one with photo id------------------

exports.uploadPhotos = async (req, res, oauth2Client) => {
  const files = req.files;
  const customTags = JSON.parse(req.body.customTags || '[]');

  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  try {
    // Retrieve user information from the OAuth2 token
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json';
    const userInfoResponse = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
      },
    });
    const ownerEmail = userInfoResponse.data.email; // Fetch owner email from the user's info
    console.log('Owner Email:', ownerEmail);

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
        filename: file.originalname,
        size: stats.size,
        type: file.mimetype,
        uploadedAt: new Date(),
        customTags: tagsForCurrentFile,
        ownerEmail, // Attach the owner's email to metadata
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
            description: `Uploaded via PhotoTaggerApp - ${file.originalname}`,
            simpleMediaItem: {
              uploadToken: uploadToken,
            },
          },
        ],
      };

      const createResponse = await axios.post(createMediaItemUrl, mediaItemRequest, { headers });
      const mediaItem = createResponse.data?.newMediaItemResults[0]?.mediaItem;

      if (!mediaItem || !mediaItem.id) {
        console.error(`Failed to retrieve mediaItem ID for ${file.originalname}`);
        uploadResults.push({
          filename: file.originalname,
          status: 'Upload successful but failed to retrieve Google Photos ID',
          customTags: fileMetadata.customTags,
        });
        continue;
      }

      // Add Google Photos ID to file metadata
      fileMetadata.googlePhotoId = mediaItem.id;

      try {
        const photoDocument = new Photo(fileMetadata);
        await photoDocument.save();

        uploadResults.push({
          filename: file.originalname,
          status: 'Uploaded and saved successfully',
          googlePhotoId: mediaItem.id,
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
  const { fromDate, toDate, location } = req.query;

  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  try {
    const photosUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
    const headers = { Authorization: `Bearer ${oauth2Client.credentials.access_token}` };

    let allPhotos = [];
    let pageToken = null;

    // Fetch user info to get the owner email
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json';
    const userInfoResponse = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
      },
    });
    const ownerEmail = userInfoResponse.data.email; // Get authenticated user's email

    // Prepare filters for Google Photos API search
    const filters = {
      dateFilter: {},
    };

    if (fromDate || toDate) {
      filters.dateFilter = {
        ranges: [
          {
            startDate: fromDate ? { year: parseInt(fromDate.split('-')[0]), month: parseInt(fromDate.split('-')[1]), day: parseInt(fromDate.split('-')[2]) } : undefined,
            endDate: toDate ? { year: parseInt(toDate.split('-')[0]), month: parseInt(toDate.split('-')[1]), day: parseInt(toDate.split('-')[2]) } : undefined,
          },
        ],
      };
    }

    // Loop to fetch all pages
    do {
      const response = await axios.post(
        photosUrl,
        { filters, pageToken, pageSize: 100 },
        { headers }
      );

      const photos = response.data.mediaItems || [];
      pageToken = response.data.nextPageToken || null; // Check for the next page token

      const filteredPhotos = photos
        .filter(photo => photo.mediaMetadata?.creationTime)
        .filter(photo => {
          // Filter by location if provided
          if (location) {
            const photoLocation = photo.location?.description || '';
            return photoLocation.toLowerCase().includes(location.toLowerCase());
          }
          return true; // Pass all photos if no location filter
        })
        .filter(photo => {
          // Additional filtering based on fromDate and toDate
          const photoDate = new Date(photo.mediaMetadata.creationTime);
          const startDate = fromDate ? new Date(fromDate) : null;
          const endDate = toDate ? new Date(toDate) : null;

          return (!startDate || photoDate >= startDate) && (!endDate || photoDate <= endDate);
        });

      // Save photo details to the database and prepare response data
      const photoDetails = await Promise.all(filteredPhotos.map(async (photo) => {
        try {
          // Check if photo already exists in the database
          const existingPhoto = await Photo.findOne({ googlePhotoId: photo.id });

          if (!existingPhoto) {
            // Save new photo to the database
            const newPhoto = new Photo({
              googlePhotoId: photo.id,
              filename: photo.filename,
              url: photo.baseUrl,
              size: parseInt(photo.mediaMetadata?.sizeBytes || 0, 10),
              type: photo.mimeType,
              customTags: [],
              description: 'Uploaded via PhotoTaggerApp',
              status: 'Uploaded',
              ownerEmail: ownerEmail, // Include ownerEmail when saving the photo
            });
            await newPhoto.save();
          }

          // Return photo details, whether new or existing
          return {
            id: photo.id,
            filename: photo.filename,
            url: photo.baseUrl,
            size: parseInt(photo.mediaMetadata?.sizeBytes || 0, 10),
            type: photo.mimeType,
            creationTime: photo.mediaMetadata.creationTime,
          };
        } catch (error) {
          if (error.code === 11000) {
            console.log(`Photo with ID ${photo.id} already exists in the database.`);
          } else {
            console.error('Error while saving photo:', error);
          }
        }
      }));

      allPhotos = allPhotos.concat(photoDetails.filter(photo => photo != null));

    } while (pageToken); // Continue until there are no more pages

    res.json(allPhotos); // Send all filtered photos back as the response
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos from Google Photos API' });
  }
};




// exports.getGooglePhotos = async (req, res, oauth2Client) => {
//   if (!oauth2Client.credentials.access_token) {
//     return res.status(401).send('Unauthorized: No access token provided');
//   }

  // const { fromDate, toDate, location } = req.query;

//   try {
//     const photosUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
//     const headers = {
//       Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
//     };

//     let filters = {};

//     if (fromDate && toDate) {
//       filters.dateFilter = {
//         ranges: [
//           {
//             startDate: {
//               year: parseInt(fromDate.split('-')[0]),
//               month: parseInt(fromDate.split('-')[1]),
//               day: parseInt(fromDate.split('-')[2]),
//             },
//             endDate: {
//               year: parseInt(toDate.split('-')[0]),
//               month: parseInt(toDate.split('-')[1]),
//               day: parseInt(toDate.split('-')[2]),
//             },
//           },
//         ],
//       };
//     }

//     const response = await axios.post(
//       photosUrl,
//       { filters },
//       { headers }
//     );

//     const photos = response.data.mediaItems || [];

//     const filteredPhotos = location
//       ? photos.filter(photo => {
//           return photo.location && photo.location.includes(location);
//         })
//       : photos;

//     const photoDetails = filteredPhotos.map((photo) => ({
//       id: photo.id,
//       url: photo.baseUrl,
//       filename: photo.filename,
//       creationTime: photo.mediaMetadata.creationTime || null, 
//     }));

//     res.status(200).json(photoDetails);
//   } catch (error) {
//     console.error('Error fetching Google Photos:', error);
//     res.status(500).send('Error fetching photos from Google Photos');
//   }
// };

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

// exports.searchPhotos = async (req, res, oauth2Client) => {
//   const { searchTerm } = req.body;
//   console.log('Received search term:', searchTerm);

//   if (!oauth2Client.credentials?.access_token) {
//     return res.status(401).json({ error: 'No access token. Please log in again.' });
//   }

//   try {
//     // Step 1: Search MongoDB for matching photos by filename or customTags
//     const matchedPhotos = await Photo.find({
//       $or: [
//         { filename: { $regex: searchTerm, $options: 'i' } },
//         { customTags: { $elemMatch: { $regex: searchTerm, $options: 'i' } } }
//       ]
//     });

//     console.log('Matched photos from MongoDB:', matchedPhotos);

//     // Get Google Photo IDs from matched MongoDB records
//     const matchedGooglePhotoIds = matchedPhotos.map(photo => photo.googlePhotoId);
//     if (matchedGooglePhotoIds.length === 0) {
//       return res.status(200).json([]); // No matches found
//     }

//     // Step 2: Retrieve images from Google Photos API with pagination
//     const photosUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
//     const headers = {
//       Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
//     };

//     let googlePhotos = [];
//     let nextPageToken = null;

//     try {
//       // Keep fetching until all photos are retrieved
//       do {
//         const requestPayload = {
//           filters: {
//             mediaTypeFilter: { mediaTypes: ["PHOTO"] }
//           },
//           pageSize: 100, // Adjust the page size to retrieve more results per request
//           ...(nextPageToken && { pageToken: nextPageToken }) // Add nextPageToken for pagination
//         };

//         const response = await axios.post(photosUrl, requestPayload, { headers });

//         // Add the current batch of photos to the googlePhotos array
//         const photos = response.data.mediaItems || [];
//         googlePhotos.push(...photos);

//         // Check for the next page of results
//         nextPageToken = response.data.nextPageToken;

//       } while (nextPageToken); // Continue fetching if there's another page

//       // Filter photos returned by Google Photos to match googlePhotoId from MongoDB
//       const matchedGooglePhotos = googlePhotos.filter(photo =>
//         matchedGooglePhotoIds.includes(photo.id)
//       );

//       googlePhotos = matchedGooglePhotos; // Use the filtered photos

//     } catch (photoError) {
//       console.error('Error fetching photos from Google Photos:', photoError);
//     }

//     // Step 3: Format response data by combining Google Photos with database details
//     const photoDetails = googlePhotos.map((photo) => {
//       const dbRecord = matchedPhotos.find(item => item.googlePhotoId === photo.id);
//       return {
//         url: `${photo.baseUrl}=w500-h500`, 
//         id: photo.id,
//         filename: photo.filename,
//         creationTime: photo.mediaMetadata?.creationTime || null,
//         customTags: dbRecord?.customTags || [],
//       };
//     });

//     // Send formatted data back to client
//     res.status(200).json(photoDetails);
//   } catch (error) {
//     console.error('Error searching photos:', error);
//     res.status(500).json({ error: 'Error fetching photos from Google Photos' });
//   }
// };

exports.searchPhotos = async (req, res, oauth2Client) => {
  const { searchTerm } = req.body;
  console.log('Received search term:', searchTerm);

  if (!oauth2Client.credentials?.access_token) {
    return res.status(401).json({ error: 'No access token. Please log in again.' });
  }

  try {
    // Step 1: Fetch user info to get ownerEmail
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json';
    const userInfoResponse = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
      },
    });
    const ownerEmail = userInfoResponse.data.email; // Fetch the authenticated user's email
    console.log('Owner Email:', ownerEmail);

    // Step 2: Search MongoDB for matching photos by filename, customTags, and ownerEmail
    const matchedPhotos = await Photo.find({
      ownerEmail: ownerEmail, // Ensure we're searching photos of the current user
      $or: [
        { filename: { $regex: searchTerm, $options: 'i' } },
        { customTags: { $elemMatch: { $regex: searchTerm, $options: 'i' } } }
      ]
    });

    console.log('Matched photos from MongoDB:', matchedPhotos);

    // Get Google Photo IDs from matched MongoDB records
    const matchedGooglePhotoIds = matchedPhotos.map(photo => photo.googlePhotoId);
    if (matchedGooglePhotoIds.length === 0) {
      return res.status(200).json([]); // No matches found
    }

    // Step 3: Retrieve images from Google Photos API with pagination
    const photosUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
    };

    let googlePhotos = [];
    let nextPageToken = null;

    try {
      // Keep fetching until all photos are retrieved
      do {
        const requestPayload = {
          filters: {
            mediaTypeFilter: { mediaTypes: ["PHOTO"] }
          },
          pageSize: 100, // Adjust the page size to retrieve more results per request
          ...(nextPageToken && { pageToken: nextPageToken }) // Add nextPageToken for pagination
        };

        const response = await axios.post(photosUrl, requestPayload, { headers });

        // Add the current batch of photos to the googlePhotos array
        const photos = response.data.mediaItems || [];
        googlePhotos.push(...photos);

        // Check for the next page of results
        nextPageToken = response.data.nextPageToken;

      } while (nextPageToken); // Continue fetching if there's another page

      // Filter photos returned by Google Photos to match googlePhotoId from MongoDB
      const matchedGooglePhotos = googlePhotos.filter(photo =>
        matchedGooglePhotoIds.includes(photo.id)
      );

      googlePhotos = matchedGooglePhotos; // Use the filtered photos

    } catch (photoError) {
      console.error('Error fetching photos from Google Photos:', photoError);
    }

    // Step 4: Format response data by combining Google Photos with database details
    const photoDetails = googlePhotos.map((photo) => {
      const dbRecord = matchedPhotos.find(item => item.googlePhotoId === photo.id);
      return {
        url: `${photo.baseUrl}=w500-h500`, 
        id: photo.id,
        filename: photo.filename,
        creationTime: photo.mediaMetadata?.creationTime || null,
        customTags: dbRecord?.customTags || [],
      };
    });

    // Send formatted data back to client
    res.status(200).json(photoDetails);
  } catch (error) {
    console.error('Error searching photos:', error);
    res.status(500).json({ error: 'Error fetching photos from Google Photos' });
  }
};



// exports.getPhotoDetails = async (req, res, oauth2Client) => {
//   const { photoId } = req.params;
//   console.log("PHOTO ID: "+photoId);
//   if (!oauth2Client.credentials.access_token) {
//     return res.status(401).json({ error: 'Unauthorized: No access token provided' });
//   }

//   try {
//     const photoDetailsUrl = `https://photoslibrary.googleapis.com/v1/mediaItems/${photoId}`;
//     const headers = {
//       Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
//     };

//     const response = await axios.get(photoDetailsUrl, { headers });
//     const photoData = response.data;

//     const photoDetails = {
//       id: photoData.id,
//       url: photoData.baseUrl,
//       filename: photoData.filename,
//       description: photoData.description || 'No description',
//       creationTime: photoData.mediaMetadata.creationTime,
//       width: photoData.mediaMetadata.width,
//       height: photoData.mediaMetadata.height,
//       mimeType: photoData.mimeType,
//     };

//     res.status(200).json(photoDetails);
//   } catch (error) {
//     console.error('Error fetching photo details:', error.response ? error.response.data : error.message);
//     res.status(500).json({ error: 'Error fetching photo details from Google Photos' });
//   }
// };

// exports.getPhotoByFileName = async (req, res) => {
//   try {
//     const { description } = req.query;
    
//     // Ensure description is provided
//     if (!description) {
//       return res.status(400).json({ error: 'Description query parameter is required' });
//     }

//     // const filename = description.split(' - ')[1]; // Extract filename
//     const filename = 'orange.jpg'; // Extract filename

//     // Check if filename is valid
//     if (!filename) {
//       return res.status(400).json({ error: 'Filename could not be extracted from description' });
//     }

//     const photo = await Photo.findOne({ filename });
//     if (!photo) {
//       return res.status(404).json({ error: 'Photo not found' });
//     }

//     res.json(photo);
//   } catch (error) {
//     console.error('Error fetching photo:', error);
//     res.status(500).json({ error: 'Failed to fetch photo' });
//   }
// };


// exports.getPhotoDetailsWithTags = async (req, res, oauth2Client) => {
//   const { photoId } = req.params;
//   console.log("PHOTO ID:", photoId);

//   if (!oauth2Client.credentials.access_token) {
//     return res.status(401).json({ error: 'Unauthorized: No access token provided' });
//   }

//   try {
//     // Step 1: Fetch the photo details from Google Photos
//     const photoDetailsUrl = `https://photoslibrary.googleapis.com/v1/mediaItems/${photoId}`;
//     const headers = {
//       Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
//     };

//     const response = await axios.get(photoDetailsUrl, { headers });
//     const photoData = response.data;

//     // Step 2: Extract filename from the description
//     const filename = photoData.description ? photoData.description.split(' - ')[1] : null;
//     if (!filename) {
//       console.error('Filename not found in description');
//       return res.status(200).json({
//         photoDetails: {
//           id: photoData.id,
//           url: photoData.baseUrl,
//           filename: photoData.filename,
//           description: photoData.description || 'No description',
//           creationTime: photoData.mediaMetadata.creationTime,
//           width: photoData.mediaMetadata.width,
//           height: photoData.mediaMetadata.height,
//           mimeType: photoData.mimeType,
//         },
//         customTags: [] // No tags if filename extraction fails
//       });
//     }

//     // Step 3: Fetch custom tags based on the filename
//     const photoRecord = await Photo.findOne({ filename });
//     const customTags = photoRecord ? photoRecord.customTags : [];

//     // Step 4: Combine photo details with custom tags and send response
//     const photoDetails = {
//       id: photoData.id,
//       url: photoData.baseUrl,
//       filename: photoData.filename,
//       description: photoData.description || 'No description',
//       creationTime: photoData.mediaMetadata.creationTime,
//       width: photoData.mediaMetadata.width,
//       height: photoData.mediaMetadata.height,
//       mimeType: photoData.mimeType,
//     };

//     res.status(200).json({ photoDetails, customTags });
//   } catch (error) {
//     console.error('Error fetching photo details:', error.response ? error.response.data : error.message);
//     res.status(500).json({ error: 'Error fetching photo details from Google Photos' });
//   }
// };

exports.getPhotoDetailsWithTags = async (req, res, oauth2Client) => {
  const { photoId } = req.params; // `photoId` is the Google Photos ID
  console.log("PHOTO ID:", photoId);

  if (!oauth2Client.credentials.access_token) {
    return res.status(401).json({ error: 'Unauthorized: No access token provided' });
  }

  try {
    // Step 1: Fetch the authenticated user's email
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json';
    const userInfoResponse = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
      },
    });
    const ownerEmail = userInfoResponse.data.email; // Get authenticated user's email
    console.log("Owner Email:", ownerEmail); // Log email to verify it's fetched correctly

    // Step 2: Fetch photo details from Google Photos using `photoId`
    const photoDetailsUrl = `https://photoslibrary.googleapis.com/v1/mediaItems/${photoId}`;
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
    };

    const response = await axios.get(photoDetailsUrl, { headers });
    const photoData = response.data;

    // Step 3: Fetch custom tags from MongoDB based on `googlePhotoId` and `ownerEmail`
    console.log("Fetching photo record from MongoDB with googlePhotoId:", photoId, "and ownerEmail:", ownerEmail);
    
    const photoRecord = await Photo.findOne({ googlePhotoId: photoId, ownerEmail: ownerEmail });
    if (!photoRecord) {
      console.log("No photo record found in DB for this photoId and ownerEmail");
    }
    
    const customTags = photoRecord ? photoRecord.customTags : [];
    console.log("Custom Tags found:", customTags); // Log custom tags to check if they are being fetched

    // Step 4: Combine Google Photos data with custom tags
    const photoDetails = {
      id: photoData.id,
      url: photoData.baseUrl,
      filename: photoData.filename,
      description: photoData.description || 'No description',
      creationTime: photoData.mediaMetadata.creationTime,
      width: photoData.mediaMetadata.width,
      height: photoData.mediaMetadata.height,
      mimeType: photoData.mimeType,
      customTags: customTags,
    };

    // Step 5: Return combined photo details and custom tags
    res.status(200).json({ photoDetails, customTags });
  } catch (error) {
    console.error('Error fetching photo details:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching photo details from Google Photos' });
  }
};

exports.addCustomTags = async (req, res, oauth2Client) => {
  const { tagName, googlePhotoId } = req.body;

  try {
    const photo = await Photo.findOneAndUpdate(
      { googlePhotoId },
      { $addToSet: { customTags: tagName } },
      { new: true }
    );

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    res.status(200).json(photo);
  } catch (error) {
    console.error('Error adding custom tag:', error);
    res.status(500).json({ message: 'Failed to add custom tag' });
  }
};

exports.deleteCustomTags = async (req, res) => {
  const { tagName, googlePhotoId } = req.body;

  try {
    const photo = await Photo.findOneAndUpdate(
      { googlePhotoId },
      { $pull: { customTags: tagName } },
      { new: true }
    );

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    res.status(200).json(photo);
  } catch (error) {
    console.error('Error deleting custom tag:', error);
    res.status(500).json({ message: 'Failed to delete custom tag' });
  }
};

exports.createSlideshow = async (req, res, oauth2Client) => {
  const { name, photoIds } = req.body;

  // Validate input
  if (!name || !photoIds || photoIds.length === 0) {
    return res.status(400).json({ error: 'Name and at least one photo are required.' });
  }

  try {
    // Ensure oauth2Client is provided
    if (!oauth2Client || !oauth2Client.credentials?.access_token) {
      return res.status(401).json({ error: 'Unauthorized: No access token provided.' });
    }

    // Fetch the user's email
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    const ownerEmail = userInfo.data.email; // Get the authenticated user's email

    const headers = { Authorization: `Bearer ${oauth2Client.credentials.access_token}` };
    const photoUrls = [];

    // Fetch URLs for the given photo IDs
    for (const photoId of photoIds) {
      try {
        const response = await axios.get(
          `https://photoslibrary.googleapis.com/v1/mediaItems/${photoId}`,
          { headers }
        );
        const baseUrl = response.data.baseUrl;
        photoUrls.push(`${baseUrl}=w500-h500`); // Save formatted URLs
      } catch (error) {
        console.error(`Error fetching photo URL for ID ${photoId}:`, error.response?.data || error.message);
        photoUrls.push(null); // Handle missing photo gracefully
      }
    }

    // Check for any missing photo URLs
    if (photoUrls.includes(null)) {
      return res.status(400).json({ error: 'Some photo IDs could not be resolved to URLs.' });
    }

    // Generate slideshowId using name and random number
    const slideshowId = `${name.replace(/\s+/g, '-').toLowerCase()}-${uuidv4().slice(0, 8)}`;

    // Create and save the slideshow with the owner's email
    const slideshow = new Slideshow({
      slideshowId,
      name,
      photoIds,
      photoUrls,
      ownerEmail, // Add the email here
    });
    console.log("Email : "+ownerEmail);
    await slideshow.save();

    res.status(201).json({
      message: 'Slideshow created successfully.',
      slideshow,
    });
  } catch (error) {
    console.error('Error saving slideshow:', error);
    res.status(500).json({ error: 'Failed to create slideshow.' });
  }
};


exports.displayAllSlideshows = async (req, res, oauth2Client) => {
  try {
    // Ensure oauth2Client has valid credentials
    if (!oauth2Client || !oauth2Client.credentials?.access_token) {
      return res.status(401).json({ error: 'No valid access token. Please log in again.' });
    }

    // Fetch the user's email using oauth2Client
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    const ownerEmail = userInfo.data.email; // Extract the email of the authenticated user

    // Fetch slideshows belonging to this user
    const slideshows = await Slideshow.find({ ownerEmail }); // Filter by ownerEmail

    if (!slideshows || slideshows.length === 0) {
      return res.status(404).json({ error: 'No slideshows found for this user.' });
    }

    // Attach slideshowId, name, createdAt, and photoUrls from the stored slideshow
    const enrichedSlideshows = slideshows.map(slideshow => ({
      slideshowId: slideshow.slideshowId,
      name: slideshow.name,
      createdAt: slideshow.createdAt,
      photoUrls: slideshow.photoUrls,
    }));

    res.status(200).json({ slideshows: enrichedSlideshows });
  } catch (error) {
    console.error('Error fetching slideshows:', error);
    res.status(500).json({ error: 'Failed to fetch slideshows' });
  }
};


exports.deleteSlideshow = async (req, res) => {
  const { id } = req.params;
  console.log(`Deleting slideshow with ID: ${id}`); // Add this line for debugging

  try {
    // Use the 'slideshowId' field in the query to match the provided ID
    const slideshow = await Slideshow.findOneAndDelete({ slideshowId: id });

    if (!slideshow) {
      return res.status(404).json({ message: 'Slideshow not found.' });
    }

    return res.status(200).json({ message: 'Slideshow deleted successfully.' });
  } catch (error) {
    console.error('Error deleting slideshow:', error);
    return res.status(500).json({ message: 'Failed to delete slideshow. Please try again.' });
  }
};




// exports.syncGooglePhotos = async (req, res, oauth2Client) => {
//   try {
//     // Fetch photos from Google Photos
//     const photos = await getPhotosFromGoogle(oauth2Client);

//     if (!photos || photos.length === 0) {
//       console.log('No photos found');
//       return res.status(404).json({ message: 'No photos found in your Google account' });
//     }

//     console.log('Fetched photos:', photos);  // Log the fetched photos

//     // Map and save details to database
//     const photoDetails = photos.map(photo => ({
//       filename: photo.filename || 'unknown',
//       url: photo.url || '',
//       creationTime: photo.creationTime || new Date(),
//       width: photo.width || 0,
//       height: photo.height || 0,
//       size: photo.size || 0,
//       mimeType: photo.mimeType || 'unknown',
//       customTags: [],
//       location: photo.location || 'Unknown'
//     }));

//     for (const details of photoDetails) {
//       await Photo.findOneAndUpdate(
//         { filename: details.filename },
//         details,
//         { upsert: true, new: true }
//       );
//     }

//     res.status(200).json({ message: 'Google Photos sync completed successfully' });
//   } catch (error) {
//     console.error('Error syncing Google Photos:', error);
//     if (!res.headersSent) {
//       res.status(500).json({ message: 'Error syncing Google Photos', error });
//     }
//   }
// };

exports.getAllGalleryImages = async (req, res, oauth2Client) => {
  try {
    // Ensure oauth2Client is provided and valid
    if (!oauth2Client || !oauth2Client.credentials?.access_token) {
      return res.status(401).json({ error: 'Unauthorized: No access token provided.' });
    }

    // Fetch the logged-in user's email
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    const ownerEmail = userInfo.data.email; // Logged-in user's email

    if (!ownerEmail) {
      return res.status(403).json({ error: 'Unable to fetch user information.' });
    }

    // Find gallery images owned by the logged-in user
    const galleryImages = await Gallery.find({ ownerName: ownerEmail });

    res.status(200).json({ galleryImages });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ error: 'Failed to fetch gallery images.' });
  }
};

exports.addGalleryImage = async (req, res, oauth2Client) => {
  const { photos } = req.body;

  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return res.status(400).json({ error: 'No photos provided.' });
  }

  try {
    // Ensure oauth2Client is provided and valid
    if (!oauth2Client || !oauth2Client.credentials?.access_token) {
      return res.status(401).json({ error: 'Unauthorized: No access token provided.' });
    }

    // Fetch the user's email
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    const ownerEmail = userInfo.data.email; // Get the authenticated user's email

    if (!ownerEmail) {
      return res.status(403).json({ error: 'Unable to fetch user information.' });
    }

    // Map the photos with additional owner information
    const sanitizedPhotos = photos.map((photo) => ({
      title: photo.title || 'Untitled', // Default title if not provided
      description: photo.description || 'No description provided', // Default description
      imageUrl: photo.imageUrl, // Validate image URL
      ownerName: ownerEmail, // Attach owner's email
    }));

    // Save to the database
    const newPhotos = await Gallery.insertMany(sanitizedPhotos);
    res.status(201).json({ message: 'Photos added successfully.', newPhotos });
  } catch (error) {
    console.error('Error adding photos:', error);
    res.status(500).json({ error: 'Failed to add photos.' });
  }
};

exports.deleteGalleryImage = async (req, res) => {
  const { imageUrl } = req.body;

  // Check if the imageUrl is provided
  if (!imageUrl) {
    console.error('No imageUrl provided');
    return res.status(400).json({ message: 'imageUrl is required' });
  }

  try {
    console.log('Attempting to delete image with URL:', imageUrl);

    // Use the correct model
    const deletedImage = await Gallery.findOneAndDelete({ imageUrl });

    if (!deletedImage) {
      console.error('Image not found in database:', imageUrl);
      return res.status(404).json({ message: 'Image not found', imageUrl });
    }

    console.log('Image deleted successfully:', deletedImage);
    res.json({ message: 'Image deleted successfully', deletedImage });
  } catch (error) {
    console.error('Error deleting image:', error.message);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
};

exports.displaySlideshowById = async (req, res) => {
  try {
    const { slideshowId } = req.params;
    const { minimal } = req.query;

    if (!slideshowId) {
      return res.status(400).json({ error: 'Slideshow ID is required.' });
    }

    const slideshow = await Slideshow.findOne({ slideshowId });
    if (!slideshow) {
      return res.status(404).json({ error: 'Slideshow not found.' });
    }

    if (minimal === 'true') {
      // Return only the photoUrls for minimal response
      return res.status(200).json({ photoUrls: slideshow.photoUrls });
    }

    res.status(200).json({
      slideshow: {
        slideshowId: slideshow.slideshowId,
        name: slideshow.name,
        createdAt: slideshow.createdAt,
        photoUrls: slideshow.photoUrls,
      },
    });
  } catch (error) {
    console.error('Error fetching slideshow:', error);
    res.status(500).json({ error: 'Failed to fetch slideshow' });
  }
};


exports.getImagesByEmail = async (req, res) => {
  const { email } = req.params; // Extract email from the request params

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    // Find all images where ownerName matches the provided email
    const galleryImages = await Gallery.find({ ownerName: email });

    if (!galleryImages || galleryImages.length === 0) {
      return res.status(404).json({ error: 'No images found for the given email.' });
    }

    // Map the gallery images to only return the image URLs
    const imageUrls = galleryImages.map((image) => image.imageUrl);

    res.status(200).json({ imageUrls });
  } catch (error) {
    console.error('Error fetching images by email:', error);
    res.status(500).json({ error: 'Failed to fetch images for the given email.' });
  }
};