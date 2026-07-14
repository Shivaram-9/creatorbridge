const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/brandcreator').then(async () => {
  const User = require('./server/src/models/User').User;
  const Message = require('./server/src/models/Message').Message;
  const user = await User.findOne({ email: 'shivaram@auraon.com' });
  if (!user) { console.log('no user'); process.exit(0); }
  const uid = user._id;

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: uid }, { receiver: uid }],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          partner: {
            $cond: [
              { $eq: ['$sender', uid] },
              '$receiver',
              '$sender',
            ]
          },
          application: { $ifNull: ['$application', null] }
        },
        lastMessage: { $first: '$$ROOT' },
      },
    },
    {
      $lookup: {
        from: 'applications',
        localField: '_id.application',
        foreignField: '_id',
        as: 'applicationData'
      }
    },
    { $unwind: { path: '$applicationData', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        applicationType: { $type: '$applicationData' },
        applicationDataId: '$applicationData._id',
      }
    }
  ]);
  console.log(JSON.stringify(conversations, null, 2));
  process.exit();
});
