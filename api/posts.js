const express = require('express');
const postsRouter = express.Router();

const { requireUser } = require('./utils');

const { 
  createPost,
  deletePost,
  getAllPosts,
  updatePost,
  getPostById,
} = require('../db');

// /api/posts
postsRouter.get('/', async (req, res, next) => {
  
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter(post => {
      // the post is active, doesn't matter who it belongs to
      if (post.active) {
        return true;
      }
    
      // the post is not active, but it belogs to the current user
      if (req.user && post.author.id === req.user.id) {
        return true;
      }
    
      // none of the above are true
      return false;
    });
  
    res.send({
      posts
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

//create-> /api/posts
postsRouter.post('/', requireUser, async (req, res, next) => {
  const { title, content = "", tags = [] } = req.body;

  const postData = {title, content, tags, authorId: req.user.id};

  try {
    const post = await createPost(postData);

    if (post) {
      res.send(post);
    } else {
      next({
        name: 'PostCreationError',
        message: 'There was an error creating your post. Please try again.'
      })
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// patch-> /api/posts/:postId
postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/);
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
      res.send({ post: updatedPost })
    } else {
      next({
        name: 'UnauthorizedUserError',
        message: 'You cannot update a post that is not yours'
      })
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// created delete route-> /api/posts/:postId
postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
  try{
    const {postId} = req.params
    const postToDelete = await getPostById(postId)
    if(!postToDelete) {
      next({
        name: 'Post Not found',
        message: `No post by ID ${postId}`
      })
    } else if(req.user.id !== postToDelete.creatorId) {
      res.status(403)
      next({
        name: "Wrong User Error",
        message: "You must be the posts author to remove this post"
      })
    } else {
      const deletedPost = await deletePost(postId)
      res.send({success: true, ...deletedPost})
    }
  }catch(error) {
    next(error)
  }
});

module.exports = postsRouter;