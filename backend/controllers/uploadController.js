const axios = require('axios');
const fs = require('fs');

exports.uploadPhotos = async (req, res, oauth2Client) => {
  const files = req.files;

  if (!oauth2Client.credentials.access_token) {
    return res.status(401).send('Unauthorized: No access token provided');
  }

  try {
    const uploadResults = [];

    for (let file of files) {
      const filePath = file.path;

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
            description: 'Uploaded via PhotoTaggerApp',
            simpleMediaItem: {
              uploadToken: uploadToken,
            },
          },
        ],
      };

      await axios.post(createMediaItemUrl, mediaItemRequest, { headers });

      uploadResults.push({
        filename: file.originalname,
        status: 'Uploaded successfully',
      });

      fs.unlinkSync(filePath);
    }

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

    console.log('Google People API Response:', profileData);

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
