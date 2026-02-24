const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const User = require('../model/User');

// Same secret from your authController
const JWT_SECRET = 'agency-os-super-secret-key-2026-secure';

// ==========================================
// 1. LOCAL STRATEGY (For Logging In)
// ==========================================
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({ username });
            
            // Use your existing correctPassword method from the User model
            if (!user || !(await user.correctPassword(password, user.password))) {
                return done(null, false, { message: 'Incorrect username or password' });
            }
            
            // Login successful! Pass the user forward.
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

// ==========================================
// 2. JWT STRATEGY (For Protecting Routes)
// ==========================================
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
        const user = await User.findById(jwt_payload.id);
        
        if (user) {
            // ⚡ THE FIX: Return the full user so 'req.user.role' exists!
            // We also attach .userId so your existing Task/Workspace controllers don't break.
            const userObj = user.toObject(); // Convert Mongoose doc to plain object
            userObj.userId = user._id;       // Alias _id to userId
            
            return done(null, userObj);
        }
        
        return done(null, false);
    } catch (err) {
        return done(err, false);
    }
}));