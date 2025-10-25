const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Project = sequelize.define(
  "Project",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [
          ["development", "design", "marketing", "writing", "seo", "other"],
        ],
      },
    },
    budget: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1000,
      },
    },
    deadline: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "open",
      validate: {
        isIn: [["open", "in_progress", "completed", "cancelled"]],
      },
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    responses: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  },
  {
    tableName: "projects",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true ,
  }
);

module.exports = Project;
