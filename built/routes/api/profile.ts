var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
// Load Validation
var validateProfileInput = require('../../validation/profile');
var validateExperienceInput = require('../../validation/experience');
var validateEducationInput = require('../../validation/education');
// Load Profile Model
var Profile = require('../../models/Profile');
// Load User Model
var User = require('../../models/User');
// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', function (req, res) { return res.json({ msg: 'Profile Works' }); });
// @route   GET api/profile
// @desc    Get current users profile
// @access  Private
router.get('/', passport.authenticate('jwt', { session: false }), function (req, res) {
   type Errors = {
       noprofile:string
   }
    const errors = {} as Errors;
    
    Profile.findOne({ user: req.user.id })
        .populate('user', ['name', 'avatar'])
        .then(function (profile) {
        if (!profile) {
            errors.noprofile = 'There is no profile for this user';
            return res.status(404).json(errors);
        }
        res.json(profile);
    })
        .catch(function (err) { return res.status(404).json(err); });
});
// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public
router.get('/all', function (req, res) {
    type Errors = {
        noprofile:string
    }
     const errors = {} as Errors;
    Profile.find()
        .populate('user', ['name', 'avatar'])
        .then(function (profiles) {
        if (!profiles) {
            errors.noprofile = 'There are no profiles';
            return res.status(404).json(errors);
        }
        res.json(profiles);
    })
        .catch(function (err) { return res.status(404).json({ profile: 'There are no profiles' }); });
});
// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public
router.get('/handle/:handle', function (req, res) {
    type Errors = {
        noprofile:string
    }
     const errors = {} as Errors;
    Profile.findOne({ handle: req.params.handle })
        .populate('user', ['name', 'avatar'])
        .then(function (profile) {
        if (!profile) {
            errors.noprofile = 'There is no profile for this user';
            res.status(404).json(errors);
        }
        res.json(profile);
    })
        .catch(function (err) { return res.status(404).json(err); });
});
// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', function (req, res) {
    type Errors = {
        noprofile:string
    }
     const errors = {} as Errors;
    Profile.findOne({ user: req.params.user_id })
        .populate('user', ['name', 'avatar'])
        .then(function (profile) {
        if (!profile) {
            errors.noprofile = 'There is no profile for this user';
            res.status(404).json(errors);
        }
        res.json(profile);
    })
        .catch(function (err) {
        return res.status(404).json({ profile: 'There is no profile for this user' });
    });
});
// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), function (req, res) {
    var _a = validateProfileInput(req.body), errors = _a.errors, isValid = _a.isValid;
    // Check Validation
    if (!isValid) {
        // Return any errors with 400 status
        return res.status(400).json(errors);
    }
    // Get fields
    type ProfileFields = {
        user:string;
        handle:string;
        company:string;
        website:string;
        location:string;
        bio:string;
        status:string;
        githubusername:string;
        skills:string;
        social: SocialFields 
    };
    
   
     const profileFields = {} as ProfileFields;
    profileFields.user = req.user.id;
    if (req.body.handle)
        profileFields.handle = req.body.handle;
    if (req.body.company)
        profileFields.company = req.body.company;
    if (req.body.website)
        profileFields.website = req.body.website;
    if (req.body.location)
        profileFields.location = req.body.location;
    if (req.body.bio)
        profileFields.bio = req.body.bio;
    if (req.body.status)
        profileFields.status = req.body.status;
    if (req.body.githubusername)
        profileFields.githubusername = req.body.githubusername;
    // Skills - Spilt into array
    if (typeof req.body.skills !== 'undefined') {
        profileFields.skills = req.body.skills.split(',');
    }
    // Social

    type SocialFields = {
        youtube:string;
        twitter:string;
        facebook:string;
        linkedin:string;
        instagram:string; 
    };
    profileFields.social = {} as SocialFields;
    if (req.body.youtube)
        profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter)
        profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook)
        profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin)
        profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram)
        profileFields.social.instagram = req.body.instagram;
    Profile.findOne({ user: req.user.id }).then(function (profile) {
        if (profile) {
            // Update
            Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true }).then(function (profile) { return res.json(profile); });
        }
        else {
            // Create
            // Check if handle exists
            Profile.findOne({ handle: profileFields.handle }).then(function (profile) {
                if (profile) {
                    errors.handle = 'That handle already exists';
                    res.status(400).json(errors);
                }
                // Save Profile
                new Profile(profileFields).save().then(function (profile) { return res.json(profile); });
            });
        }
    });
});
// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post('/experience', passport.authenticate('jwt', { session: false }), function (req, res) {
    var _a = validateExperienceInput(req.body), errors = _a.errors, isValid = _a.isValid;
    // Check Validation
    if (!isValid) {
        // Return any errors with 400 status
        return res.status(400).json(errors);
    }
    Profile.findOne({ user: req.user.id }).then(function (profile) {
        var newExp = {
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            from: req.body.from,
            to: req.body.to,
            current: req.body.current,
            description: req.body.description
        };
        // Add to exp array
        profile.experience.unshift(newExp);
        profile.save().then(function (profile) { return res.json(profile); });
    });
});
// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private
router.post('/education', passport.authenticate('jwt', { session: false }), function (req, res) {
    var _a = validateEducationInput(req.body), errors = _a.errors, isValid = _a.isValid;
    // Check Validation
    if (!isValid) {
        // Return any errors with 400 status
        return res.status(400).json(errors);
    }
    Profile.findOne({ user: req.user.id }).then(function (profile) {
        var newEdu = {
            school: req.body.school,
            degree: req.body.degree,
            fieldofstudy: req.body.fieldofstudy,
            from: req.body.from,
            to: req.body.to,
            current: req.body.current,
            description: req.body.description
        };
        // Add to exp array
        profile.education.unshift(newEdu);
        profile.save().then(function (profile) { return res.json(profile); });
    });
});
// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }), function (req, res) {
    Profile.findOne({ user: req.user.id })
        .then(function (profile) {
        // Get remove index
        var removeIndex = profile.experience
            .map(function (item) { return item.id; })
            .indexOf(req.params.exp_id);
        // Splice out of array
        profile.experience.splice(removeIndex, 1);
        // Save
        profile.save().then(function (profile) { return res.json(profile); });
    })
        .catch(function (err) { return res.status(404).json(err); });
});
// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }), function (req, res) {
    Profile.findOne({ user: req.user.id })
        .then(function (profile) {
        // Get remove index
        var removeIndex = profile.education
            .map(function (item) { return item.id; })
            .indexOf(req.params.edu_id);
        // Splice out of array
        profile.education.splice(removeIndex, 1);
        // Save
        profile.save().then(function (profile) { return res.json(profile); });
    })
        .catch(function (err) { return res.status(404).json(err); });
});
// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private
router.delete('/', passport.authenticate('jwt', { session: false }), function (req, res) {
    Profile.findOneAndRemove({ user: req.user.id }).then(function () {
        User.findOneAndRemove({ _id: req.user.id }).then(function () {
            return res.json({ success: true });
        });
    });
});
module.exports = router;
