const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/brandcreator').then(async () => {
  try {
    const Message = require('./server/src/models/Message').Message;
    // ensure Application is registered
    require('./server/src/models/Application');
    require('./server/src/models/Campaign');
    const User = require('./server/src/models/User').User;
    
    const user = await User.findOne({ email: 'shivaram@auraon.com' });
    if (!user) { console.log('User not found'); process.exit(0); }
    const uid = user._id;

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: uid }, { receiver: uid }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            partner: {
              $cond: [
                { $eq: ['$sender', uid] },
                '$receiver',
                '$sender'
              ]
            },
            application: { $ifNull: ['$application', null] }
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      { $lookup: { from: 'applications', localField: '_id.application', foreignField: '_id', as: 'applicationData' } },
      { $unwind: { path: '$applicationData', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'campaigns', localField: 'applicationData.campaign', foreignField: '_id', as: 'campaignData' } },
      { $unwind: { path: '$campaignData', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          application: {
            $cond: [
              { $eq: [{ $type: '$applicationData' }, 'missing'] },
              null,
              {
                _id: '$applicationData._id',
                campaignId: '$campaignData._id',
                campaignTitle: '$campaignData.title',
                status: '$applicationData.status'
              }
            ]
          },
          lastMessage: 1
        }
      }
    ]);
    console.log(JSON.stringify(conversations, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
