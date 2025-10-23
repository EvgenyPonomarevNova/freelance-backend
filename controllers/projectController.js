const Project = require('../models/Project');

exports.createProject = async (req, res) => {
  try {
    const { title, description, category, budget, deadline, skills } = req.body;

    const project = await Project.create({
      title,
      description,
      category,
      budget,
      deadline,
      skills,
      client: req.user.id
    });

    res.status(201).json({
      status: 'success',
      project
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: 'open' })
      .populate('client', 'profile.name profile.avatar')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      results: projects.length,
      projects
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};