const express = require('express');
const usersRouter = express.Router();

const { 
  createUser,
  getAllUsers,
  getUserByUsername,
  getMostUsedHashTags
} = require('../db');

const jwt = require('jsonwebtoken');
const { requireUser } = require('./utils');

// /api/users
usersRouter.get('/', async (req, res, next) => {
  try {
    const users = await getAllUsers();
  
    res.send({
      users
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// /api/users/login
usersRouter.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  // request must have both
  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password"
    });
  }

  try {
    const user = await getUserByUsername(username);

    if (user && user.password == password) {
      const token = jwt.sign({ 
        id: user.id, 
        username
      }, process.env.JWT_SECRET, {
        expiresIn: '1w'
      });

      res.send({ 
        message: "you're logged in!",
        token 
      });
    } else {
      next({ 
        name: 'IncorrectCredentialsError', 
        message: 'Username or password is incorrect'
      });
    }
  } catch(error) {
    console.log(error);
    next(error);
  }
});

// /api/users/register
usersRouter.post('/register', async (req, res, next) => {
  const { username, password, name, location } = req.body;

  try {
    const _user = await getUserByUsername(username);
  
    if (_user) {
      next({
        name: 'UserExistsError',
        message: 'A user by that username already exists'
      });
    }

    const user = await createUser({
      username,
      password,
      name,
      location,
    });

    const token = jwt.sign({ 
      id: user.id, 
      username
    }, process.env.JWT_SECRET, {
      expiresIn: '1w'
    });

    res.send({ 
      message: "thank you for signing up",
      token 
    });
  } catch ({ name, message }) {
    next({ name, message });
  } 
});

//created GET-> /api/users/me  
usersRouter.get('/me', requireUser, async (req, res, next) => {
  try{
    const user = req.user
    const userPosts = await getPostsByUser(req.user.id)

    const userData = {
      user: user,
      posts: userPosts
    }
    // send all user info & posts
    res.send(userData)
  }catch(error){
    next(error)
  }
})

// get users most used hashtags!
// /api/users/hashtags
usersRouter.get('/hashtags', requireUser, async (req, res, next) => {
  try{
    const userId = req.user.id

    const mostUsedHashtags = await getMostUsedHashTags(userId)

    // send list of most used hashtags
    res.json({ mostUsedHashtags })

  }catch(error){
    next(error)
  }
})

module.exports = usersRouter;