const { getModels } = require('../config/database');

const addOrUpdateUser = async (chatId, userName, firstName) => {
    try {
        const models = getModels();
        const { User } = models;
        
        const [user, created] = await User.findOrCreate({
            where: { chatId },
            defaults: {
                userName,
                firstName,
                requestCount: 1,
                lastUpdated: new Date(),
            },
        });

        if (!created) {
            user.requestCount += 1;
            user.lastUpdated = new Date();
            await user.save();
        }

        return user;
    } catch (error) {
        console.error('Error adding or updating user:', error);
    }
};

module.exports = { addOrUpdateUser };
