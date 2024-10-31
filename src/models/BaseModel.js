const { Model } = require('objection');
const knex = require('../db/knex');

Model.knex(knex);

class BaseModel extends Model {
  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static get useLimitInFirst() {
    return true;
  }

  static get modelPaths() {
    return [__dirname];
  }
}

module.exports = BaseModel;