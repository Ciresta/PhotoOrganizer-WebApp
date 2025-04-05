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
/**
 * @swagger
 * tags:
 *   name: Photos
 *   description: Endpoints for uploading photos and attaching custom metadata
 */

/**
 * @swagger
 * tags:
 *   name: Custom Tags
 *   description: Endpoints for add remove custom tags
 */


/**
 * @swagger
 * tags:
 *   name: Slideshow
 *   description: Endpoints for slideshow operations
 */

/**
 * @swagger
 * tags:
 *   name: Gallery
 *   description: Endpoints for gallery operations
 */


/**
 * @swagger
 * /add:
 *   post:
 *     tags:
 *       - Photos
 *     summary: Upload photos to Google Photos with custom tags
 *     description: Upload photos to Google Photos with associated custom tags. Each photo must have a corresponding tag array.
 *     operationId: uploadPhotos
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: photos
 *         in: formData
 *         description: Photos to be uploaded
 *         required: true
 *         type: array
 *         items:
 *           type: file
 *       - name: customTags
 *         in: formData
 *         description: An array of custom tags for each photo
 *         required: false
 *         type: string
 *       - name: Authorization
 *         in: header
 *         description: OAuth2 Bearer token for authentication
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Photos uploaded successfully and saved to the database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Photos processed successfully
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                         example: "example.jpg"
 *                       status:
 *                         type: string
 *                         example: "Uploaded and saved successfully"
 *                       googlePhotoId:
 *                         type: string
 *                         example: "A12345"
 *                       customTags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["vacation", "beach"]
 *       400:
 *         description: Bad request, e.g., mismatched photos and tags
 *       401:
 *         description: Unauthorized, access token is missing or invalid
 *       500:
 *         description: Internal server error during the upload or save process
 */

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

/**
 * @swagger
 * /api/photos:
 *   get:
 *     tags:
 *       - Photos
 *     summary: Retrieve all photos
 *     description: Returns a list of photos from the user's Google Photos account, filtered optionally by date and location.
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter photos by location description
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: OAuth2 Bearer token for Google Photos API
 *     responses:
 *       200:
 *         description: List of photos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The photo's unique ID
 *                   filename:
 *                     type: string
 *                   url:
 *                     type: string
 *                   size:
 *                     type: integer
 *                   type:
 *                     type: string
 *                   creationTime:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
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
/**
 * @swagger
 * /user/profile:
 *   get:
 *     tags:
 *       - Photos
 *     summary: Retrieve the user's Google profile
 *     description: Fetches the user's profile information (name, email, birthday, and profile picture) from Google People API using the OAuth2 token.
 *     operationId: getUserProfile
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         description: OAuth2 Bearer token for authentication
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "johndoe@example.com"
 *                 birthday:
 *                   type: object
 *                   properties:
 *                     year:
 *                       type: integer
 *                       example: 1990
 *                     month:
 *                       type: integer
 *                       example: 5
 *                     day:
 *                       type: integer
 *                       example: 15
 *                 profilePic:
 *                   type: string
 *                   example: "https://example.com/path/to/profile-pic.jpg"
 *       401:
 *         description: Unauthorized, access token is missing or invalid
 *       500:
 *         description: Internal server error while fetching user profile
 */
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
/**
 * @swagger
 * /searchPhotos:
 *   post:
 *     tags:
 *       - Photos
 *     summary: Search for photos based on a search term
 *     description: Searches for photos stored in MongoDB and Google Photos using a provided search term, which can match filenames or custom tags.
 *     operationId: searchPhotos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               searchTerm:
 *                 type: string
 *                 description: The search term to filter photos by, either in the filename or custom tags.
 *                 example: "vacation"
 *     responses:
 *       200:
 *         description: A list of matched photos from Google Photos and MongoDB
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                     description: URL of the photo in Google Photos (scaled to 500x500)
 *                     example: "https://example.com/photo-url=w500-h500"
 *                   id:
 *                     type: string
 *                     description: The unique ID of the photo in Google Photos
 *                     example: "abc123"
 *                   filename:
 *                     type: string
 *                     description: The filename of the photo
 *                     example: "vacation_beach.jpg"
 *                   creationTime:
 *                     type: string
 *                     format: date-time
 *                     description: The creation time of the photo in ISO 8601 format
 *                     example: "2022-05-20T15:30:00Z"
 *                   customTags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: A list of custom tags associated with the photo
 *                     example: ["vacation", "beach"]
 *       401:
 *         description: Unauthorized, access token is missing or invalid
 *       500:
 *         description: Server error while fetching or searching photos
 */

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
/**
 * @swagger
 * /photos/{photoId}:
 *   get:
 *     tags:
 *       - Photos
 *     summary: Retrieve photo details along with custom tags
 *     description: Fetches details of a specific photo from Google Photos using the provided `photoId`, along with associated custom tags stored in MongoDB.
 *     operationId: getPhotoDetailsWithTags
 *     parameters:
 *       - name: photoId
 *         in: path
 *         required: true
 *         description: The unique ID of the photo in Google Photos.
 *         schema:
 *           type: string
 *           example: "abc123"
 *     responses:
 *       200:
 *         description: Photo details and associated custom tags
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 photoDetails:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The unique ID of the photo in Google Photos
 *                       example: "abc123"
 *                     url:
 *                       type: string
 *                       description: The URL of the photo in Google Photos
 *                       example: "https://example.com/photo-url"
 *                     filename:
 *                       type: string
 *                       description: The filename of the photo
 *                       example: "vacation_beach.jpg"
 *                     description:
 *                       type: string
 *                       description: The description of the photo (if any)
 *                       example: "A beautiful beach during vacation."
 *                     creationTime:
 *                       type: string
 *                       format: date-time
 *                       description: The creation time of the photo
 *                       example: "2022-05-20T15:30:00Z"
 *                     width:
 *                       type: integer
 *                       description: The width of the photo
 *                       example: 1920
 *                     height:
 *                       type: integer
 *                       description: The height of the photo
 *                       example: 1080
 *                     mimeType:
 *                       type: string
 *                       description: The MIME type of the photo
 *                       example: "image/jpeg"
 *                 customTags:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: The custom tags associated with the photo
 *                   example: ["vacation", "beach"]
 *       401:
 *         description: Unauthorized, access token is missing or invalid
 *       500:
 *         description: Server error while fetching photo details from Google Photos
 */

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
/**
 * @swagger
 * /photos/tags:
 *   post:
 *     tags:
 *       - Custom Tags
 *     summary: Add custom tag to a photo
 *     description: Adds a custom tag to a specific photo identified by the `googlePhotoId`. This operation will add the tag to the `customTags` array of the corresponding photo in the database.
 *     operationId: addCustomTags
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagName:
 *                 type: string
 *                 description: The custom tag to be added to the photo
 *                 example: "vacation"
 *               googlePhotoId:
 *                 type: string
 *                 description: The unique Google Photos ID of the photo to which the tag will be added
 *                 example: "abc123"
 *     responses:
 *       200:
 *         description: The photo with the newly added custom tag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 googlePhotoId:
 *                   type: string
 *                   description: The unique Google Photos ID of the photo
 *                   example: "abc123"
 *                 customTags:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: The array of custom tags associated with the photo
 *                   example: ["vacation", "beach"]
 *       400:
 *         description: Invalid input, missing `tagName` or `googlePhotoId`
 *       404:
 *         description: Photo not found in the database
 *       500:
 *         description: Server error while adding custom tag
 */
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
/**
 * @swagger
 * /photos/tags:
 *   delete:
 *     tags:
 *       - Custom Tags
 *     summary: Remove a custom tag from a photo
 *     description: Removes a specific custom tag from a photo identified by the `googlePhotoId`. This operation will remove the tag from the `customTags` array of the corresponding photo in the database.
 *     operationId: deleteCustomTags
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagName:
 *                 type: string
 *                 description: The custom tag to be removed from the photo
 *                 example: "vacation"
 *               googlePhotoId:
 *                 type: string
 *                 description: The unique Google Photos ID of the photo from which the tag will be removed
 *                 example: "abc123"
 *     responses:
 *       200:
 *         description: The photo with the removed custom tag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 googlePhotoId:
 *                   type: string
 *                   description: The unique Google Photos ID of the photo
 *                   example: "abc123"
 *                 customTags:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: The updated array of custom tags associated with the photo
 *                   example: ["beach"]
 *       400:
 *         description: Invalid input, missing `tagName` or `googlePhotoId`
 *       404:
 *         description: Photo not found in the database
 *       500:
 *         description: Server error while deleting custom tag
 */

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
/**
 * @swagger
 * /slideshow:
 *   post:
 *     tags:
 *       - Slideshow
 *     summary: Create a new slideshow
 *     description: Creates a new slideshow by selecting a list of photo IDs and giving the slideshow a name. The slideshow is then saved and linked to the user's Google account.
 *     operationId: createSlideshow
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the slideshow.
 *                 example: "Summer Vacation"
 *               photoIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of Google Photos media item IDs to be included in the slideshow.
 *                 example: ["photo1id", "photo2id", "photo3id"]
 *     responses:
 *       201:
 *         description: Slideshow created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Slideshow created successfully.'
 *                 slideshow:
 *                   type: object
 *                   properties:
 *                     slideshowId:
 *                       type: string
 *                       description: The unique identifier for the slideshow.
 *                       example: "summer-vacation-12345678"
 *                     name:
 *                       type: string
 *                       description: The name of the slideshow.
 *                       example: "Summer Vacation"
 *                     photoIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of photo IDs included in the slideshow.
 *                       example: ["photo1id", "photo2id", "photo3id"]
 *                     photoUrls:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of formatted URLs for each photo in the slideshow.
 *                       example: ["https://photos.google.com/photo1-url", "https://photos.google.com/photo2-url"]
 *                     ownerEmail:
 *                       type: string
 *                       description: The email address of the user who created the slideshow.
 *                       example: "user@example.com"
 *       400:
 *         description: Invalid input. Missing name or photo IDs, or some photo IDs could not be resolved to URLs.
 *       401:
 *         description: Unauthorized. No access token provided.
 *       500:
 *         description: Internal server error while creating slideshow.
 */
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
/**
 * @swagger
 * /slideshow:
 *   get:
 *     tags:
 *       - Slideshow
 *     summary: Retrieve all slideshows for the authenticated user
 *     description: Fetches a list of all slideshows created by the authenticated user, including the slideshow ID, name, creation date, and photo URLs.
 *     operationId: displayAllSlideshows
 *     responses:
 *       200:
 *         description: A list of slideshows for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slideshows:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       slideshowId:
 *                         type: string
 *                         description: The unique identifier of the slideshow
 *                         example: "summer-vacation-12345678"
 *                       name:
 *                         type: string
 *                         description: The name of the slideshow
 *                         example: "Summer Vacation"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: The date and time when the slideshow was created
 *                         example: "2025-04-01T12:00:00Z"
 *                       photoUrls:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: List of URLs of the photos included in the slideshow
 *                         example: ["https://photos.google.com/photo1-url", "https://photos.google.com/photo2-url"]
 *       401:
 *         description: Unauthorized. No valid access token provided.
 *       404:
 *         description: No slideshows found for this user.
 *       500:
 *         description: Internal server error while fetching slideshows.
 */
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

/**
 * @swagger
 * /slideshow/{slideshowId}:
 *   get:
 *     tags:
 *       - Slideshow
 *     summary: Retrieve a slideshow by its ID
 *     description: Fetches a specific slideshow by its ID, with an option for a minimal response (only photo URLs).
 *     operationId: displaySlideshowById
 *     parameters:
 *       - in: path
 *         name: slideshowId
 *         required: true
 *         description: The unique ID of the slideshow
 *         schema:
 *           type: string
 *         example: "summer-vacation-12345678"
 *       - in: query
 *         name: minimal
 *         required: false
 *         description: If true, returns only the photo URLs for a minimal response.
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *     responses:
 *       200:
 *         description: Successfully retrieved the slideshow
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slideshow:
 *                   type: object
 *                   properties:
 *                     slideshowId:
 *                       type: string
 *                       description: The unique identifier of the slideshow
 *                       example: "summer-vacation-12345678"
 *                     name:
 *                       type: string
 *                       description: The name of the slideshow
 *                       example: "Summer Vacation"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: The date and time when the slideshow was created
 *                       example: "2025-04-01T12:00:00Z"
 *                     photoUrls:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of URLs of the photos in the slideshow
 *                       example: ["https://photos.google.com/photo1-url", "https://photos.google.com/photo2-url"]
 *       400:
 *         description: Bad request. Slideshow ID is required.
 *       404:
 *         description: Slideshow not found.
 *       500:
 *         description: Internal server error while fetching slideshow.
 */
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




/**
 * @swagger
 * /slideshow/{id}:
 *   delete:
 *     tags:
 *       - Slideshow
 *     summary: Delete a slideshow by its ID
 *     description: Deletes a slideshow from the database using its unique slideshow ID.
 *     operationId: deleteSlideshow
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique ID of the slideshow to be deleted.
 *         schema:
 *           type: string
 *         example: "summer-vacation-12345678"
 *     responses:
 *       200:
 *         description: Successfully deleted the slideshow.
 *       404:
 *         description: Slideshow not found.
 *       500:
 *         description: Internal server error while deleting the slideshow.
 */
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



/**
 * @swagger
 * /gallery:
 *   get:
 *     tags:
 *       - Gallery
 *     summary: Get all gallery images for the authenticated user
 *     description: Fetches all gallery images stored in the database for the authenticated user, based on their email.
 *     operationId: getAllGalleryImages
 *     responses:
 *       200:
 *         description: A list of gallery images for the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 galleryImages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Unique ID of the gallery image
 *                       imageUrl:
 *                         type: string
 *                         description: URL of the image
 *                         example: "https://photos.google.com/media/image123.jpg"
 *                       title:
 *                         type: string
 *                         description: Optional title or description of the image
 *                         example: "Sunset by the beach"
 *                       ownerName:
 *                         type: string
 *                         description: The email of the user who owns this image
 *                         example: "user@example.com"
 *       401:
 *         description: Unauthorized. No access token provided.
 *       403:
 *         description: User information could not be fetched.
 *       500:
 *         description: Internal server error while fetching gallery images.
 */

exports.getAllGalleryImages = async (req, res, oauth2Client) => {
  try {
    if (!oauth2Client || !oauth2Client.credentials?.access_token) {
      return res.status(401).json({ error: 'Unauthorized: No access token provided.' });
    }

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    const ownerEmail = userInfo.data.email; // Logged-in user's email

    if (!ownerEmail) {
      return res.status(403).json({ error: 'Unable to fetch user information.' });
    }

    const galleryImages = await Gallery.find({ ownerName: ownerEmail });

    res.status(200).json({ galleryImages });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ error: 'Failed to fetch gallery images.' });
  }
};

/**
 * @swagger
 * /gallery:
 *   post:
 *     tags:
 *       - Gallery
 *     summary: Add new images to the gallery
 *     description: Adds one or more photos to the user's gallery with optional title and description. The user's email is extracted from the authenticated session.
 *     operationId: addGalleryImage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       description: Optional title of the photo
 *                       example: "My Beach Photo"
 *                     description:
 *                       type: string
 *                       description: Optional description of the photo
 *                       example: "Taken at sunset during vacation"
 *                     imageUrl:
 *                       type: string
 *                       description: URL of the image to add
 *                       example: "https://photos.google.com/media/photo123.jpg"
 *     responses:
 *       201:
 *         description: Photos added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Photos added successfully.
 *                 newPhotos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       ownerName:
 *                         type: string
 *       400:
 *         description: Bad request. No photos provided or invalid format.
 *       401:
 *         description: Unauthorized. No access token provided.
 *       403:
 *         description: Unable to fetch user information.
 *       500:
 *         description: Internal server error while adding photos.
 */
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

/**
 * @swagger
 * /gallery:
 *   delete:
 *     tags:
 *       - Gallery
 *     summary: Delete an image from the gallery
 *     description: Deletes a specific image from the user's gallery using the image URL.
 *     operationId: deleteGalleryImage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: The URL of the image to delete
 *                 example: "https://photos.google.com/media/photo123.jpg"
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image deleted successfully
 *                 deletedImage:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                     ownerName:
 *                       type: string
 *       400:
 *         description: Bad request. imageUrl not provided.
 *       404:
 *         description: Image not found in the database.
 *       500:
 *         description: Internal server error while deleting image.
 */
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

/**
 * @swagger
 * /gallery/email/{email}:
 *   get:
 *     tags:
 *       - Gallery
 *     summary: Get gallery images by email
 *     description: Retrieves a list of image URLs from the gallery for a specific user by their email address.
 *     operationId: getImagesByEmail
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: The email address of the user whose images are to be fetched.
 *         schema:
 *           type: string
 *         example: "user@example.com"
 *     responses:
 *       200:
 *         description: A list of image URLs for the specified email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [
 *                     "https://photos.google.com/media/photo1.jpg",
 *                     "https://photos.google.com/media/photo2.jpg"
 *                   ]
 *       400:
 *         description: Email is required.
 *       404:
 *         description: No images found for the given email.
 *       500:
 *         description: Internal server error while fetching images.
 */
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

/**
 * @swagger
 * /gallery/photo/{photoId}:
 *   delete:
 *     tags:
 *       - Gallery
 *     summary: Delete a photo by its Google Photos ID
 *     description: Deletes a photo from Google Photos (via Google Drive API) and removes its metadata from the database for the authenticated user.
 *     operationId: deletePhoto
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         description: The unique Google Photos ID of the photo to be deleted.
 *         schema:
 *           type: string
 *         example: "AKxyz123456"
 *     responses:
 *       200:
 *         description: Photo deleted successfully from Google Photos and database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Photo deleted successfully from Google Photos and database
 *       401:
 *         description: Unauthorized - no valid access token provided.
 *       404:
 *         description: Photo not found in the database for this user.
 *       500:
 *         description: Failed to delete photo due to an internal error (Google API or database).
 */
exports.deletePhoto = async (req, res, oauth2Client) => {
  const { photoId } = req.params; // Google Photos ID
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
    console.log("Owner Email:", ownerEmail);

    // Step 2: Check if the photo exists in MongoDB
    console.log("Checking if photo exists in MongoDB with googlePhotoId:", photoId, "and ownerEmail:", ownerEmail);
    const photoRecord = await Photo.findOne({ googlePhotoId: photoId, ownerEmail });

    if (!photoRecord) {
      return res.status(404).json({ error: 'Photo not found in database' });
    }

    // Step 3: Delete the photo from Google Photos via Google Drive
    console.log("Deleting photo from Google Photos...");
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const deleteResponse = await drive.files.delete({ fileId: photoId });

    if (deleteResponse.status !== 204) {
      console.error("Failed to delete photo from Google Drive");
      return res.status(500).json({ error: 'Failed to delete photo from Google Photos' });
    }
    console.log("Photo successfully deleted from Google Drive.");

    // Step 4: Remove photo metadata from MongoDB
    console.log("Removing photo record from MongoDB...");
    await Photo.deleteOne({ googlePhotoId: photoId, ownerEmail });

    // Step 5: Return success response
    res.status(200).json({ message: 'Photo deleted successfully from Google Photos and database' });
  } catch (error) {
    console.error('Error deleting photo:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error deleting photo from Google Photos and database' });
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


