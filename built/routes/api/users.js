var express = require('express');
var router = express.Router();
var gravatar = require('gravatar');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var keys = require('../../config/keys');
var passport = require('passport');
// Load Input Validation
var validateRegisterInput = require('../../validation/register');
var validateLoginInput = require('../../validation/login');
// Load User model
var User = require('../../models/User');
// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get('/test', function (req, res) { return res.json({ msg: 'Users Works' }); });
// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post('/register', function (req, res) {
    var _a = validateRegisterInput(req.body), errors = _a.errors, isValid = _a.isValid;
    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    User.findOne({ email: req.body.email }).then(function (user) {
        if (user) {
            errors.email = 'Email already exists';
            return res.status(400).json(errors);
        }
        else {
            var avatar = gravatar.url(req.body.email, {
                s: '200',
                r: 'pg',
                d: 'mm' // Default
            });
            var newUser_1 = new User({
                name: req.body.name,
                email: req.body.email,
                avatar: avatar,
                password: req.body.password
            });
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(newUser_1.password, salt, function (err, hash) {
                    if (err)
                        throw err;
                    newUser_1.password = hash;
                    newUser_1
                        .save()
                        .then(function (user) { return res.json(user); })["catch"](function (err) { return console.log(err); });
                });
            });
        }
    });
});
// @route   GET api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post('/login', function (req, res) {
    var _a = validateLoginInput(req.body), errors = _a.errors, isValid = _a.isValid;
    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    var email = req.body.email;
    var password = req.body.password;
    // Find user by email
    User.findOne({ email: email }).then(function (user) {
        // Check for user
        if (!user) {
            errors.email = 'User not found';
            return res.status(404).json(errors);
        }
        // Check Password
        bcrypt.compare(password, user.password).then(function (isMatch) {
            if (isMatch) {
                // User Matched
                var payload = { id: user.id, name: user.name, avatar: user.avatar }; // Create JWT Payload
                // Sign Token
                jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, function (err, token) {
                    res.json({
                        success: true,
                        token: 'Bearer ' + token
                    });
                });
            }
            else {
                errors.password = 'Password incorrect';
                return res.status(400).json(errors);
            }
        });
    });
});
// @route   GET api/users/current
// @desc    Return current user
// @access  Private
router.get('/current', passport.authenticate('jwt', { session: false }), function (req, res) {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    });
});
module.exports = router;
