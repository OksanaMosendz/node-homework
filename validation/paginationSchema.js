const Joi = require("joi");

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).default(10),

  sortBy: Joi.string()
    .valid("title", "priority", "createdAt", "id", "isCompleted")
    .default("createdAt"),

  sortDirection: Joi.string()
    .valid("asc", "desc")
    .default("desc"),

  find: Joi.string().allow(""),
  isCompleted: Joi.string(),
  priority: Joi.string(),
  min_date: Joi.date(),
  max_date: Joi.date(),
}).options({
  allowUnknown: true,
  convert: true,
});

module.exports={paginationSchema};