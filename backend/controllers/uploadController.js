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

exports.getGooglePhotos = async (req, res, oauth2Client) => {
  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  const { fromDate, toDate } = req.query; // Get date range from query parameters

  try {
    const photosUrl = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
    };

    let filters = {};

    // If both fromDate and toDate are provided, apply the date filter
    if (fromDate && toDate) {
      filters = {
        dateFilter: {
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
        },
      };
    }

    // Make a POST request to Google Photos API
    const response = await axios.post(
      photosUrl,
      { filters }, // Use filters only if date range is provided
      { headers }
    );

    const photos = response.data.mediaItems || [];

    // Send the filtered or all photo URLs to the frontend
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

exports.getUserProfile = async (req, res, oauth2Client) => {
  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  // Log the access token for debugging
  console.log('Access Token:', oauth2Client.credentials.access_token);

  try {
    const peopleUrl = 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,birthdays,photos';
    const headers = {
      Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
    };

    // Fetch the user's profile from Google People API
    const response = await axios.get(peopleUrl, { headers });
    const profileData = response.data;

    // Log the response from Google People API
    console.log('Google People API Response:', profileData);

    // Parse the profile data
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
