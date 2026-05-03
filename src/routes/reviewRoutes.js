const express = require("express");
const Review = require("../models/Review");
const { requireAuth } = require("../middleware/auth");
const { mapDoc, mapDocs } = require("../utils/mapDoc");

const router = express.Router();

// Get reviews for a specific target (garage or supplier)
router.get("/target/:id", async (req, res, next) => {
  try {
    const reviews = await Review.find({ targetId: req.params.id }).sort({ createdAt: -1 });
    return res.json(mapDocs(reviews));
  } catch (error) {
    return next(error);
  }
});

// Get reviews by author
router.get("/author", requireAuth, async (req, res, next) => {
  try {
    const reviews = await Review.find({ authorId: req.authUserId }).sort({ createdAt: -1 });
    return res.json(mapDocs(reviews));
  } catch (error) {
    return next(error);
  }
});

// Add a new review
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { targetId, targetType, rating, comment, authorName } = req.body;
    
    // Check if user already reviewed this target
    const existing = await Review.findOne({ 
      authorId: req.authUserId, 
      targetId 
    });

    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this item" });
    }

    const review = await Review.create({
      authorId: req.authUserId,
      authorName,
      targetId,
      targetType,
      rating,
      comment
    });

    return res.status(201).json(mapDoc(review));
  } catch (error) {
    return next(error);
  }
});

// Update a review
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.authorId !== req.authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { rating, comment } = req.body;
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    
    await review.save();
    return res.json(mapDoc(review));
  } catch (error) {
    return next(error);
  }
});

// Delete a review
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Only author or admin can delete
    if (review.authorId !== req.authUserId) {
      // Need to check if user is admin - but for now just author
      return res.status(403).json({ message: "Not allowed" });
    }

    await Review.findByIdAndDelete(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
