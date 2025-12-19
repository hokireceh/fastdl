const { Sequelize } = require('sequelize');
const { log } = require('../utils');
const { initModels } = require('../models');

let sequelize = null;
let models = null;

const connectDB = async () => {
    try {
        if (!sequelize) {
            sequelize = new Sequelize(process.env.DATABASE_URL, {
                dialect: 'postgres',
                logging: false,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                },
            });
        }

        await sequelize.authenticate();
        log('PostgreSQL connected successfully');
        
        // Initialize models
        if (!models) {
            models = initModels(sequelize);
        }
        
        // Sync models
        await sequelize.sync({ alter: true });
        log('Database models synced');
        
        return { sequelize, models };
    } catch (error) {
        log('Error connecting to PostgreSQL:', error);
        process.exit(1);
    }
};

const getModels = () => models;
const getSequelize = () => sequelize;

module.exports = { connectDB, getModels, getSequelize };
