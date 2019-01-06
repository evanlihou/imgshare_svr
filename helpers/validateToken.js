module.exports = async function(decoded, request) {
    if (!decoded) {
        throw Boom.unauthorized(null, 'Unable to decode your session');
    }
    if (!decoded.session_id) {
        return { isValid: false };
    }
    const session = await Session.findById(decoded.session_id);
    if (!session) {
        return { isValid: false };
    }
    if (session.expires_at < new Date()) {
        // Expired
        return { isValid: false };
    }
    // Associated user exists in DB
    const user = await User.findById(session.user);
    if (!user || user.deletedAt) {
        return { isValid: false };
    }
    // Update expiration of token
    var expires_at_time = new Date();
    expires_at_time.setDate(expires_at_time.getDate() + 1); // Expires in 1 day
    session.expires_at = expires_at_time;
    session.save();
    return {
        isValid: true,
        credentials: { ...user, sessionId: session._id }
    };
};
