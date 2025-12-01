import sequelize from '../config/database';
import Ticket from './Ticket';
import Job from './Job';
import JobItem from './JobItem';

const models = {
  Ticket,
  Job,
  JobItem,
  sequelize,
};

export default models;
