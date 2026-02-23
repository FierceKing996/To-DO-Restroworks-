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
        // Find the user based on the ID inside the decoded token
        const user = await User.findById(jwt_payload.id);
        
        if (user) {
            // ⚡ CRITICAL: We format this exactly how your controllers expect it!
            // Your existing code uses req.user.userId, so we return exactly that.
            return done(null, { userId: user._id }); 
        }
        
        return done(null, false);
    } catch (err) {
        return done(err, false);
    }
}));