module.exports = fn => {
    return (req, res, next) => {
        //wrapper for controller if catches we send to middleware
        fn(req, res, next).catch(next);
    };
};