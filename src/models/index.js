const { DataTypes } = require('sequelize');
const { REQUEST_STATUS } = require('../constants');

let models = {};

const initModels = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        chatId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        userName: DataTypes.STRING,
        firstName: DataTypes.STRING,
        requestCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        lastUpdated: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        timestamps: false,
        tableName: 'users',
    });

    const ContentRequest = sequelize.define('ContentRequest', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        chatId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        requestUrl: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        requestedByUserName: {
            type: DataTypes.STRING,
            field: 'requested_by_user_name',
        },
        requestedByFirstName: {
            type: DataTypes.STRING,
            field: 'requested_by_first_name',
        },
        shortCode: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            defaultValue: REQUEST_STATUS.PENDING,
        },
        retryCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        messageId: DataTypes.STRING,
        requestedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        timestamps: false,
        tableName: 'content_requests',
    });

    const ContentResponse = sequelize.define('ContentResponse', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        ownerUserName: {
            type: DataTypes.STRING,
            field: 'owner_user_name',
        },
        ownerAvatarUrl: {
            type: DataTypes.TEXT,
            field: 'owner_avatar_url',
        },
        ownerFullName: {
            type: DataTypes.STRING,
            field: 'owner_full_name',
        },
        requestedByUserName: {
            type: DataTypes.STRING,
            field: 'requested_by_user_name',
        },
        requestedByFirstName: {
            type: DataTypes.STRING,
            field: 'requested_by_first_name',
        },
        requestUrl: DataTypes.STRING,
        shortCode: DataTypes.STRING,
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        mediaUrl: DataTypes.TEXT,
        mediaType: DataTypes.STRING,
        captionText: DataTypes.TEXT,
        displayUrl: DataTypes.TEXT,
        thumbnailUrl: DataTypes.TEXT,
        videoUrl: DataTypes.TEXT,
        mediaList: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
    }, {
        timestamps: false,
        tableName: 'content_responses',
    });

    const Metrics = sequelize.define('Metrics', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        totalRequests: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'total_requests',
        },
        graphVideoCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'graph_video_count',
        },
        graphImageCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'graph_image_count',
        },
        graphSidecarCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'graph_sidecar_count',
        },
        lastUpdated: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'last_updated',
        },
    }, {
        timestamps: false,
        tableName: 'metrics',
    });

    models = { User, ContentRequest, ContentResponse, Metrics };
    return models;
};

const getModels = () => models;

module.exports = { initModels, getModels };
