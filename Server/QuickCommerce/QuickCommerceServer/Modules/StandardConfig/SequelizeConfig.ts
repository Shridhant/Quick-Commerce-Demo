
import { Sequelize } from 'sequelize';
import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USER } from './SettingsReader';

// Initialize Sequelize instance
const sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, {
  host: MYSQL_HOST,
  dialect: 'mysql',
});

export { sequelize };
